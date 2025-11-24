const crypto = require('crypto');
const createError = require('http-errors');
const config = require('../../../config/env');
const User = require('../../../models/user.model');
const { attachUserToSession } = require('./session-auth.service');
const { buildUserResponse } = require('../utils/response.util');
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');

const PASSWORD_RESET_TOKEN_TTL_MS = config.passwordResetTokenTtlMs || 15 * 60 * 1000;

const generateResetToken = () => crypto.randomBytes(32).toString('hex');
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const requestPasswordReset = async (req, { email, phone }) => {
  const identifier = email ? { email } : phone ? { phone } : null;

  const response = {
    message: 'If an account exists, reset instructions have been sent.',
    expiresInMs: PASSWORD_RESET_TOKEN_TTL_MS
  };

  if (!identifier) {
    return response;
  }

  const user = await User.findOne(identifier);

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

  await recordActivitySafe({
    userId: user.id,
    action: ACTIVITY_ACTIONS.AUTH_PASSWORD_RESET_REQUESTED,
    label: 'Requested password reset',
    meta: { via: email ? 'email' : 'phone' },
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
