const createError = require('http-errors');
const config = require('../../../config/env');
const User = require('../../../models/user.model');
const Company = require('../../../models/company.model');
const {
  SIGNUP_SESSION_KEY,
  BUSINESS_CATEGORY_SET,
  COMPANY_REQUIRED_TYPES
} = require('../constants');
const { splitFullName, sanitizeCategories } = require('../utils/signup.util');
const { buildUserResponse } = require('../utils/response.util');
const { attachUserToSession } = require('./session-auth.service');

const OTP_CODE = config.signupOtp;
const OTP_TTL_MS = config.signupOtpTtlMs;

const getSignupState = (session) => session[SIGNUP_SESSION_KEY];
const setSignupState = (session, state) => {
  session[SIGNUP_SESSION_KEY] = state;
};
const clearSignupState = (session) => {
  delete session[SIGNUP_SESSION_KEY];
};

const maybeCreateInitialCompany = async (
  user,
  { accountType, companyName, categories: providedCategories }
) => {
  if (!COMPANY_REQUIRED_TYPES.has(accountType)) {
    return user;
  }

  if (!companyName?.trim()) {
    throw createError(400, 'Company name is required for the selected account type');
  }

  const normalizedCategories =
    Array.isArray(providedCategories) && providedCategories.length
      ? providedCategories
      : sanitizeCategories(providedCategories, BUSINESS_CATEGORY_SET);

  if (!normalizedCategories.length) {
    throw createError(400, 'Select at least one business category');
  }

  const company = await Company.create({
    displayName: companyName.trim(),
    type: accountType,
    categories: normalizedCategories,
    contact: {
      email: user.email,
      phone: user.phone
    },
    owner: user.id,
    createdBy: user.id,
    status: 'active'
  });

  user.companies.push(company.id);
  user.activeCompany = company.id;

  return user.save();
};

const startSignup = async ({ fullName, email, phone }, session) => {
  const normalizedFullName = fullName.trim().replace(/\s+/g, ' ');
  const normalizedPhone = phone.trim();

  const existingUser = await User.findOne({ $or: [{ email }, { phone: normalizedPhone }] });
  if (existingUser) {
    throw createError(409, 'User with provided email or phone already exists');
  }

  setSignupState(session, {
    fullName: normalizedFullName,
    email,
    phone: normalizedPhone,
    otp: OTP_CODE,
    otpExpiresAt: Date.now() + OTP_TTL_MS,
    otpVerified: false
  });

  return {
    message: 'OTP has been generated for verification',
    expiresInMs: OTP_TTL_MS
  };
};

const verifySignupOtp = ({ otp }, session) => {
  const sessionState = getSignupState(session);

  if (!sessionState) {
    throw createError(400, 'Start signup before verifying the OTP');
  }

  if (Date.now() > sessionState.otpExpiresAt) {
    throw createError(410, 'OTP has expired. Please request a new code.');
  }

  if (otp !== sessionState.otp) {
    throw createError(400, 'Invalid OTP provided');
  }

  sessionState.otpVerified = true;
  sessionState.otpVerifiedAt = new Date().toISOString();

  return { message: 'OTP verification successful' };
};

const completeSignup = async ({ password, accountType, companyName, categories }, req) => {
  const sessionState = getSignupState(req.session);

  if (!sessionState || !sessionState.otpVerified) {
    throw createError(400, 'Verify your OTP before completing signup');
  }

  let normalizedCategories = [];
  if (COMPANY_REQUIRED_TYPES.has(accountType)) {
    if (!companyName?.trim()) {
      throw createError(400, 'Company name is required for the selected account type');
    }
    normalizedCategories = sanitizeCategories(categories, BUSINESS_CATEGORY_SET);
    if (!normalizedCategories.length) {
      throw createError(400, 'Select at least one business category');
    }
  }

  const { firstName, lastName } = splitFullName(sessionState.fullName);
  const now = new Date();

  let user = await User.create({
    firstName,
    lastName,
    displayName: sessionState.fullName,
    email: sessionState.email,
    phone: sessionState.phone,
    password,
    emailVerifiedAt: now,
    phoneVerifiedAt: now
  });

  user = await maybeCreateInitialCompany(user, {
    accountType,
    companyName,
    categories: normalizedCategories,
  });

  await attachUserToSession(req, user.id);
  clearSignupState(req.session);

  return buildUserResponse(user);
};

module.exports = {
  startSignup,
  verifySignupOtp,
  completeSignup
};
