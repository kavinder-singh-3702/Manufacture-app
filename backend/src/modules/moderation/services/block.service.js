const createError = require('http-errors');
const mongoose = require('mongoose');
const UserBlock = require('../../../models/userBlock.model');
const User = require('../../../models/user.model');

const blockUser = async ({ blockerId, blockedUserId, reason }) => {
  if (!mongoose.Types.ObjectId.isValid(blockedUserId)) {
    throw createError(400, 'Invalid user id');
  }
  if (blockerId.toString() === blockedUserId.toString()) {
    throw createError(400, 'You cannot block yourself.');
  }

  const target = await User.findById(blockedUserId).select('role').lean();
  if (!target) throw createError(404, 'User not found');

  // Support and admin accounts can never be blocked. Blocking is there to
  // protect users from other users; letting someone block the platform's
  // own support team would cut off their only route to help — including
  // the route they'd need to report the very abuse that prompted it.
  if (target.role === 'admin' || target.role === 'super-admin') {
    throw createError(
      400,
      'Support cannot be blocked. If you have a problem with our team, please email us instead.'
    );
  }

  try {
    const doc = await UserBlock.create({
      blocker: blockerId,
      blocked: blockedUserId,
      reason: typeof reason === 'string' ? reason.trim() : undefined,
    });
    return doc.toObject();
  } catch (err) {
    // Compound unique index — treat "already blocked" as idempotent
    // success so a double-tap on Block doesn't error.
    if (err?.code === 11000) {
      return { alreadyBlocked: true };
    }
    throw err;
  }
};

const unblockUser = async ({ blockerId, blockedUserId }) => {
  if (!mongoose.Types.ObjectId.isValid(blockedUserId)) {
    throw createError(400, 'Invalid user id');
  }
  const result = await UserBlock.deleteOne({ blocker: blockerId, blocked: blockedUserId });
  return { removed: result.deletedCount > 0 };
};

const listBlockedByMe = async (blockerId) => {
  const blocks = await UserBlock.find({ blocker: blockerId })
    .sort({ createdAt: -1 })
    .populate('blocked', 'displayName email avatarUrl role')
    .lean();
  return blocks.map((b) => ({
    id: b._id.toString(),
    blocked: b.blocked,
    reason: b.reason,
    createdAt: b.createdAt,
  }));
};

/**
 * Returns the set of user ids that either blocked `userId` or were blocked
 * by `userId`. Used by chat delivery + marketplace lookups to hide the
 * blocked party in either direction.
 */
const getBlockPartnerIds = async (userId) => {
  const [asBlocker, asBlocked] = await Promise.all([
    UserBlock.find({ blocker: userId }).select('blocked').lean(),
    UserBlock.find({ blocked: userId }).select('blocker').lean(),
  ]);
  const set = new Set();
  asBlocker.forEach((b) => set.add(b.blocked.toString()));
  asBlocked.forEach((b) => set.add(b.blocker.toString()));
  return set;
};

const isBlockedEitherDirection = async (userA, userB) => {
  if (!userA || !userB) return false;
  const exists = await UserBlock.exists({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  });
  return Boolean(exists);
};

module.exports = {
  blockUser,
  unblockUser,
  listBlockedByMe,
  getBlockPartnerIds,
  isBlockedEitherDirection,
};
