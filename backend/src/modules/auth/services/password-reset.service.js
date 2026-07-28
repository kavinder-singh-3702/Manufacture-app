const crypto = require('crypto');
const createError = require('http-errors');
const config = require('../../../config/env');
const User = require('../../../models/user.model');
const { attachUserToSession } = require('./session-auth.service');
const { buildUserResponse } = require('../utils/response.util');
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');
const { sendPasswordResetEmail } = require('../../../services/email.service');

const PASSWORD_RESET_TOKEN_TTL_MS = config.passwordResetTokenTtlMs || 15 * 60 * 1000;

const generateResetToken = () => crypto.randomBytes(32).toString('hex');
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const requestPasswordReset = async (req, { email, phone }) => {
  // No SMS transport is wired up yet — a phone request would silently create
  // an unreachable token, and the client would tell the user "check your
  // inbox" (which is wrong). Short-circuit here so the client can render an
  // honest message and steer the user toward email. This also avoids
  // creating unused reset tokens in the DB for phone lookups.
  if (!email && phone) {
    return {
      channel: 'phone_unavailable',
      message: "SMS password reset isn't available yet. Please enter your email address to receive a reset code.",
      expiresInMs: PASSWORD_RESET_TOKEN_TTL_MS
    };
  }

  const response = {
    channel: 'email',
    message: "If an account exists for this email, reset instructions have been sent to your inbox.",
    expiresInMs: PASSWORD_RESET_TOKEN_TTL_MS
  };

  if (!email) {
    return response;
  }

  const user = await User.findOne({ email });

  if (!user) {
    return response;
  }

  const plainToken = generateResetToken();
  user.passwordResetToken = hashResetToken(plainToken);
  user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
  await user.save({ validateBeforeSave: false });

  if (config.node !== 'production') {
    response.resetToken = plainToken;
    response.expiresAt = user.passwordResetExpires;
  }

  // Send the reset token by email so the user can actually complete the
  // flow in production. Fire-and-forget: a slow/failed SMTP must not
  // stall the client response; email.service already logs failures.
  if (user.email) {
    const displayName = user.displayName || user.firstName || user.email.split('@')[0];
    setImmediate(() => {
      sendPasswordResetEmail({
        to: user.email,
        fullName: displayName,
        resetToken: plainToken,
        expiresInMs: PASSWORD_RESET_TOKEN_TTL_MS,
      }).catch((err) => {
        console.error('[PasswordReset] Failed to send reset email:', err?.message || err);
      });
    });
  }

  await recordActivitySafe({
    userId: user.id,
    action: ACTIVITY_ACTIONS.AUTH_PASSWORD_RESET_REQUESTED,
    label: 'Requested password reset',
    meta: { via: 'email' },
    context: extractRequestContext(req)
  });

  return response;
};

const resetPassword = async (req, { token, password }) => {
  const hashedToken = hashResetToken(token.trim());

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    throw createError(400, 'Invalid or expired reset token');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  await attachUserToSession(req, user.id);
  await recordActivitySafe({
    userId: user.id,
    action: ACTIVITY_ACTIONS.AUTH_PASSWORD_RESET,
    label: 'Password reset',
    description: 'Password was reset via token flow',
    context: extractRequestContext(req)
  });
  return buildUserResponse(user);
};

module.exports = {
  requestPasswordReset,
  resetPassword
};
