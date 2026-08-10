const createError = require('http-errors');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const UserDevice = require('../models/userDevice.model');
const UserFavorite = require('../models/userFavorite.model');
const Notification = require('../models/notification.model');
const UserPreferenceEvent = require('../models/userPreferenceEvent.model');
const { ACTIVITY_ACTIONS } = require('../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../modules/activity/services/activity.service');

/**
 * Apple App Store Guideline 5.1.1(v) requires apps that let users create
 * accounts to also let them delete those accounts from inside the app,
 * along with the associated personal data (except where retention is
 * legally required, e.g. tax records for past orders).
 *
 * This service implements a soft-delete + anonymize pattern:
 *  - User doc: personal fields wiped, email overwritten with a unique
 *    tombstone so a fresh signup with the same address is possible.
 *  - Products: unpublished (archived) but retained so past orders that
 *    reference them stay readable.
 *  - Chat: messages retained on the counterparty's side; sender's
 *    display name reads as "Deleted User" once the doc is anonymized.
 *  - Push devices + notifications + preference events: hard-deleted.
 *  - Companies: NOT auto-deleted here (a company can have other
 *    members and open orders). Owner must remove or transfer the
 *    company separately if they want it gone.
 *  - Orders / vouchers / feedback: retained (tax + audit trail).
 *
 * Sessions issued before deletion are forced out via sessionInvalidBefore.
 */

const buildTombstoneEmail = (userId) => `deleted-${userId}@deleted.arvann.local`;

const anonymizeUserDocument = async (user) => {
  const tombstoneEmail = buildTombstoneEmail(user._id.toString());
  user.email = tombstoneEmail;
  user.phone = undefined;
  user.appleUserId = undefined;
  user.username = undefined;
  user.displayName = 'Deleted User';
  user.firstName = undefined;
  user.lastName = undefined;
  user.avatarUrl = undefined;
  user.coverImageUrl = undefined;
  user.bio = undefined;
  user.dateOfBirth = undefined;
  user.address = undefined;
  user.socialLinks = undefined;
  user.secondaryEmails = [];
  user.metadata = undefined;
  user.status = 'deleted';
  user.deletedAt = new Date();
  // Force all outstanding JWTs to fail auth immediately.
  user.sessionInvalidBefore = new Date();
  // Clear reset credentials so a stale email token can't resurrect the account.
  user.passwordResetToken = undefined;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetAttempts = 0;
  user.passwordResetLastSentAt = undefined;
  user.passwordResetResendCount = 0;
  // Rotate the password to a random unrecoverable value so no old hash
  // survives. bcrypt hash of 64 random bytes; nobody knows the plaintext.
  const randomBytes = require('crypto').randomBytes(64).toString('hex');
  user.password = await bcrypt.hash(randomBytes, 10);
  await user.save({ validateBeforeSave: false });
};

const unpublishOwnedProducts = async (userId) => {
  // Marks the user's products as archived so they disappear from the
  // marketplace but stay in the DB — past order line items still resolve.
  await Product.updateMany(
    { createdBy: userId, deletedAt: { $exists: false } },
    { $set: { status: 'archived', updatedAt: new Date() } }
  );
};

const purgeDevicesAndInbox = async (userId) => {
  // Push devices: hard-delete so the user's iPhone stops receiving
  // notifications addressed to the now-deleted account.
  await UserDevice.deleteMany({ user: userId }).catch(() => undefined);
  // Notifications: hard-delete the personal inbox. Broadcast copies to
  // other users are unaffected.
  await Notification.deleteMany({ user: userId }).catch(() => undefined);
  // Favorites: personal signal, no reason to retain post-deletion.
  await UserFavorite.deleteMany({ user: userId }).catch(() => undefined);
  // Behavior signals: personal, purge.
  await UserPreferenceEvent.deleteMany({ user: userId }).catch(() => undefined);
};

const deleteCurrentUserAccount = async (req, { password, confirm }) => {
  // Belt-and-braces: require the caller to type the exact confirmation
  // phrase AND (for email/password accounts) re-enter their password.
  // Apple's rule is about the delete flow being reachable in-app; the
  // password gate is our own guard against accidental / hijacked deletes.
  if (confirm !== 'DELETE') {
    throw createError(400, 'Please type DELETE to confirm.');
  }

  // Load user WITH password field selected (schema hides it by default).
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    throw createError(404, 'User not found');
  }
  if (user.status === 'deleted' || user.deletedAt) {
    throw createError(410, 'Account is already deleted.');
  }

  // Password re-check applies only to accounts that authenticate via
  // password. Apple-signin-only accounts have no known password on the
  // client, so we skip this check for them — the delete is still gated
  // by an authenticated session (JWT proves identity) plus the typed
  // DELETE confirmation.
  const hasAppleOnly = Boolean(user.appleUserId) && !user.emailVerifiedAt;
  if (!hasAppleOnly) {
    if (typeof password !== 'string' || !password.length) {
      throw createError(400, 'Enter your password to confirm deletion.');
    }
    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      throw createError(401, 'Password did not match.');
    }
  }

  const userId = user._id;

  // Record the deletion BEFORE anonymizing so the activity row still
  // links to the account's original identity for audit purposes.
  await recordActivitySafe({
    userId,
    action: ACTIVITY_ACTIONS.USER_ACCOUNT_DELETED || 'user.account.deleted',
    label: 'Account deleted',
    description: 'User initiated account deletion from inside the app',
    meta: { email: user.email },
    context: extractRequestContext(req)
  });

  await unpublishOwnedProducts(userId);
  await purgeDevicesAndInbox(userId);
  await anonymizeUserDocument(user);

  return {
    success: true,
    message: 'Your account and personal data have been deleted.'
  };
};

module.exports = {
  deleteCurrentUserAccount
};
