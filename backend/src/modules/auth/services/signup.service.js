const crypto = require('crypto');
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
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');
const { sendSignupOtpEmail } = require('../../../services/email.service');

const OTP_FORMAT_REGEX = /^[0-9]{6}$/;
const resolveFixedOtpCode = () => {
  const configuredOtp = config.signupTestOtp || config.signupOtp;
  if (!configuredOtp) {
    return null;
  }

  const normalizedOtp = String(configuredOtp).trim();
  if (!OTP_FORMAT_REGEX.test(normalizedOtp)) {
    console.warn('[SignupService] Ignoring invalid SIGNUP_TEST_OTP. Expected exactly 6 numeric digits.');
    return null;
  }

  return normalizedOtp;
};

const FIXED_OTP_CODE = resolveFixedOtpCode();
const OTP_TTL_MS = Math.max(Number(config.signupOtpTtlMs) || 5 * 60 * 1000, 1);
const OTP_RESEND_COOLDOWN_MS = Math.max(Number(config.signupOtpResendCooldownMs) || 30 * 1000, 1);
const OTP_MAX_VERIFY_ATTEMPTS = Math.max(Number(config.signupOtpMaxVerifyAttempts) || 5, 1);
const OTP_MAX_RESENDS = Math.max(Number(config.signupOtpMaxResends) || 5, 0);

const getSignupState = (session) => session[SIGNUP_SESSION_KEY];
const setSignupState = (session, state) => {
  session[SIGNUP_SESSION_KEY] = state;
};
const clearSignupState = (session) => {
  delete session[SIGNUP_SESSION_KEY];
};

const normalizeFullName = (value) => value.trim().replace(/\s+/g, ' ');
const normalizeEmail = (value) => value.trim().toLowerCase();
const normalizePhone = (value) => value.trim();

const generateSignupOtp = () => {
  if (FIXED_OTP_CODE) {
    return FIXED_OTP_CODE;
  }
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
};

const createOtpCooldownError = (remainingMs) => {
  const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
  return createError(429, `Please wait ${remainingSeconds} seconds before requesting another code`);
};

const ensureUniqueEmail = async (email) => {
  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    throw createError(409, 'User with provided email already exists');
  }
};

const ensureUniquePhone = async (phone) => {
  if (!phone) return;
  const existingUser = await User.findOne({ phone }).lean();
  if (existingUser) {
    throw createError(409, 'User with provided phone already exists');
  }
};

const sendSignupOtp = async ({ fullName, email, otp }) => {
  const emailResult = await sendSignupOtpEmail({
    to: email,
    fullName,
    otp,
    expiresInMs: OTP_TTL_MS
  });

  if (!emailResult?.success) {
    throw createError(502, emailResult?.errorMessage || 'Unable to send verification email');
  }
};

const markOtpVerified = (sessionState) => {
  sessionState.otpVerified = true;
  sessionState.otpVerifiedAt = new Date().toISOString();
  sessionState.verifyAttempts = 0;
  return sessionState;
};

const validateOtpAgainstSession = ({ otp, sessionState, session, allowAlreadyVerified = false }) => {
  if (!sessionState) {
    throw createError(400, 'Start signup before verifying the OTP');
  }

  if (allowAlreadyVerified && sessionState.otpVerified) {
    return sessionState;
  }

  if (Date.now() > sessionState.otpExpiresAt) {
    throw createError(410, 'OTP has expired. Please request a new code.');
  }

  if ((sessionState.verifyAttempts || 0) >= OTP_MAX_VERIFY_ATTEMPTS) {
    throw createError(429, 'Too many invalid attempts. Request a new code.');
  }

  if (otp !== sessionState.otp) {
    sessionState.verifyAttempts = (sessionState.verifyAttempts || 0) + 1;
    setSignupState(session, sessionState);

    if (sessionState.verifyAttempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      throw createError(429, 'Too many invalid attempts. Request a new code.');
    }

    throw createError(400, 'Invalid OTP provided');
  }

  markOtpVerified(sessionState);
  setSignupState(session, sessionState);
  return sessionState;
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
    status: 'pending-verification',
    complianceStatus: 'pending'
  });

  if (!Array.isArray(user.companies)) {
    user.companies = [];
  }
  user.companies.push(company._id);
  user.activeCompany = company._id;

  return user.save();
};

const startSignup = async ({ fullName, email, phone }, session) => {
  const normalizedFullName = normalizeFullName(fullName);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = typeof phone === 'string' && phone.trim() ? normalizePhone(phone) : undefined;
  const currentState = getSignupState(session);
  const sameIdentity =
    currentState &&
    currentState.fullName === normalizedFullName &&
    currentState.email === normalizedEmail;

  await ensureUniqueEmail(normalizedEmail);
  await ensureUniquePhone(normalizedPhone);

  if (sameIdentity && currentState.lastOtpSentAt) {
    const elapsedMs = Date.now() - currentState.lastOtpSentAt;
    if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
      throw createOtpCooldownError(OTP_RESEND_COOLDOWN_MS - elapsedMs);
    }
  }

  if (sameIdentity && (currentState.resendCount || 0) >= OTP_MAX_RESENDS) {
    throw createError(429, 'Maximum OTP resend attempts reached. Please try again later.');
  }

  const otp = generateSignupOtp();
  await sendSignupOtp({
    fullName: normalizedFullName,
    email: normalizedEmail,
    otp
  });

  const now = Date.now();
  const nextState = {
    fullName: normalizedFullName,
    email: normalizedEmail,
    phone: sameIdentity ? normalizedPhone || currentState.phone : normalizedPhone,
    otp,
    otpExpiresAt: now + OTP_TTL_MS,
    otpVerified: false,
    otpVerifiedAt: undefined,
    lastOtpSentAt: now,
    resendCount: sameIdentity ? (currentState.resendCount || 0) + 1 : 0,
    verifyAttempts: 0
  };

  setSignupState(session, nextState);

  return {
    message: sameIdentity ? 'A new OTP has been sent to your email' : 'OTP has been sent to your email',
    expiresInMs: OTP_TTL_MS,
    resendAvailableInMs: OTP_RESEND_COOLDOWN_MS
  };
};

const verifySignupOtp = ({ otp }, session) => {
  const sessionState = validateOtpAgainstSession({
    otp,
    sessionState: getSignupState(session),
    session
  });

  return {
    message: 'OTP verification successful',
    verifiedAt: sessionState.otpVerifiedAt
  };
};

const saveSignupContact = async ({ phone }, session) => {
  const sessionState = getSignupState(session);

  if (!sessionState || !sessionState.otpVerified) {
    throw createError(400, 'Verify your email before adding a mobile number');
  }

  const normalizedPhone = normalizePhone(phone);
  await ensureUniquePhone(normalizedPhone);

  sessionState.phone = normalizedPhone;
  sessionState.phoneCapturedAt = new Date().toISOString();
  setSignupState(session, sessionState);

  return {
    message: 'Mobile number saved',
    phone: normalizedPhone
  };
};

const completeSignup = async (
  { password, accountType, companyName, categories, fullName, email, phone, otp },
  req
) => {
  const sessionState = getSignupState(req.session);

  if (!sessionState) {
    throw createError(400, 'Start signup before completing signup');
  }

  if (!sessionState.otpVerified) {
    if (!otp) {
      throw createError(400, 'Verify your OTP before completing signup');
    }

    validateOtpAgainstSession({
      otp,
      sessionState,
      session: req.session
    });
  }

  const resolvedFullName = sessionState.fullName || fullName;
  const resolvedEmail = sessionState.email || email;
  const resolvedPhone =
    sessionState.phone ||
    (typeof phone === 'string' && phone.trim() ? normalizePhone(phone) : undefined);

  if (!resolvedFullName || !resolvedEmail || !resolvedPhone) {
    throw createError(400, 'Full name, email, and phone are required to complete signup');
  }

  const normalizedFullName = normalizeFullName(resolvedFullName);
  const normalizedEmail = normalizeEmail(resolvedEmail);
  const normalizedPhone = normalizePhone(resolvedPhone);

  await ensureUniqueEmail(normalizedEmail);
  await ensureUniquePhone(normalizedPhone);

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

  const { firstName, lastName } = splitFullName(normalizedFullName);
  const now = new Date();

  let user = await User.create({
    firstName,
    lastName,
    displayName: normalizedFullName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    accountType,
    emailVerifiedAt: now
  });

  user = await maybeCreateInitialCompany(user, {
    accountType,
    companyName,
    categories: normalizedCategories,
  });

  await attachUserToSession(req, user.id);
  clearSignupState(req.session);

  await recordActivitySafe({
    userId: user.id,
    action: ACTIVITY_ACTIONS.AUTH_SIGNUP_COMPLETED,
    label: 'Account created',
    description: companyName ? `Signed up as ${accountType} with ${companyName}` : 'Completed onboarding',
    companyId: user.activeCompany,
    companyName,
    meta: { accountType, companyName },
    context: extractRequestContext(req)
  });

  return buildUserResponse(user);
};

module.exports = {
  startSignup,
  verifySignupOtp,
  saveSignupContact,
  completeSignup
};
