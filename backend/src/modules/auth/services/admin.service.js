const createError = require('http-errors');
const config = require('../../../config/env');
const User = require('../../../models/user.model');
const { splitFullName } = require('../utils/signup.util');
const { buildUserResponse } = require('../utils/response.util');
const { attachUserToSession } = require('./session-auth.service');
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');
const { signToken } = require('../../../utils/token');

const normalizeFullName = (fullName = '') => fullName.trim().replace(/\s+/g, ' ');

const ensureValidInviteToken = (token) => {
  if (!config.adminInviteToken) {
    throw createError(503, 'Admin invite token is not configured');
  }

  if (token !== config.adminInviteToken) {
    throw createError(403, 'Invalid admin invite token');
  }
};

const ensureUniqueUser = async (email, phone) => {
  const identifiers = [{ email }];
  if (phone) {
    identifiers.push({ phone });
  }

  const existingUser = await User.findOne({ $or: identifiers });
  if (existingUser) {
    throw createError(409, 'User with provided email or phone already exists');
  }
};

const createAdminAccount = async (req, { fullName, email, phone, password, adminToken, role }) => {
  ensureValidInviteToken(adminToken);

  const normalizedFullName = normalizeFullName(fullName);
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone ? phone.trim() : undefined;

  await ensureUniqueUser(normalizedEmail, normalizedPhone);

  const { firstName, lastName } = splitFullName(normalizedFullName);
  const now = new Date();

  const user = await User.create({
    firstName,
    lastName,
    displayName: normalizedFullName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role: role === 'super-admin' ? 'super-admin' : 'admin',
    status: 'active',
    emailVerifiedAt: now,
    phoneVerifiedAt: normalizedPhone ? now : undefined
  });

  await attachUserToSession(req, user.id);
  await recordActivitySafe({
    userId: user.id,
    action: ACTIVITY_ACTIONS.AUTH_SIGNUP_COMPLETED,
    label: 'Admin account created',
    description: 'Admin account bootstrapped',
    meta: { method: 'admin-invite' },
    context: extractRequestContext(req)
  });

  return {
    user: buildUserResponse(user),
    token: signToken(user)
  };
};

module.exports = {
  createAdminAccount
};
