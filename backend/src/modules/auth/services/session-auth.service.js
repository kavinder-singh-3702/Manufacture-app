const createError = require('http-errors');
const config = require('../../../config/env');
const User = require('../../../models/user.model');
const { regenerateSession, destroySession } = require('../../../services/session.service');
const { buildUserResponse } = require('../utils/response.util');
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');

const attachUserToSession = async (req, userId) => {
  await regenerateSession(req);
  req.session.userId = userId;
  req.session.lastAuthenticatedAt = new Date().toISOString();
};

const loginWithPassword = async (req, { email, phone, password }) => {
  if (!email && !phone) {
    throw createError(400, 'Email or phone is required');
  }

  const identifier = email ? { email } : { phone };
  const user = await User.findOne(identifier).select('+password');

  if (!user) {
    throw createError(401, 'Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw createError(401, 'Invalid credentials');
  }

  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip;
  await user.save({ validateBeforeSave: false });

  await attachUserToSession(req, user.id);
  await recordActivitySafe({
    userId: user.id,
    action: ACTIVITY_ACTIONS.AUTH_LOGIN,
    label: 'Signed in',
    description: email ? 'Authenticated with email + password' : 'Authenticated with phone + password',
    meta: { email: user.email, method: email ? 'email' : 'phone' },
    context: extractRequestContext(req)
  });
  return buildUserResponse(user);
};

const logout = async (req) => {
  const userId = req.session?.userId;
  await destroySession(req);
  if (userId) {
    await recordActivitySafe({
      userId,
      action: ACTIVITY_ACTIONS.AUTH_LOGOUT,
      label: 'Signed out',
      context: extractRequestContext(req)
    });
  }
  return config.sessionName;
};

module.exports = {
  attachUserToSession,
  loginWithPassword,
  logout
};
