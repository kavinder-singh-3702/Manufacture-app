const createError = require('http-errors');
const config = require('../../../config/env');
const User = require('../../../models/user.model');
const { regenerateSession, destroySession } = require('../../../services/session.service');
const { buildUserResponse } = require('../utils/response.util');
const { clearStaleActiveCompany } = require('../utils/activeCompany.util');
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');

const attachUserToSession = async (req, userId) => {
  await regenerateSession(req);
  req.session.userId = userId;
  req.session.lastAuthenticatedAt = new Date().toISOString();
};

const loginWithPassword = async (req, { email, phone, password }) => {
  // ============ TEST ADMIN CREDENTIALS - REMOVE AFTER TESTING ============
  const TEST_ADMIN_EMAIL = 'admin@example.com';
  const TEST_ADMIN_PASSWORD = 'AdminPass!234';
  const TEST_ADMIN_OBJECT_ID = '000000000000000000000001'; // Valid 24-char hex ObjectId

  if (email === TEST_ADMIN_EMAIL && password === TEST_ADMIN_PASSWORD) {
    const testAdminUser = {
      id: TEST_ADMIN_OBJECT_ID,
      _id: TEST_ADMIN_OBJECT_ID,
      email: TEST_ADMIN_EMAIL,
      firstName: 'Jane',
      lastName: 'Admin',
      displayName: 'Jane Admin',
      phone: '+15551234567',
      role: 'admin',
      status: 'active',
      accountType: 'manufacturer',
      verificationStatus: 'verified',
      activeCompany: null,
      companies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await attachUserToSession(req, testAdminUser.id);
    return testAdminUser;
  }
  // ============ END TEST ADMIN CREDENTIALS ============

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

  await clearStaleActiveCompany(user);

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
