const crypto = require('crypto');
const createError = require('http-errors');
const config = require('../../../config/env');
const User = require('../../../models/user.model');
const { PHONE_CHANGE_SESSION_KEY } = require('../constants');
const { buildUserResponse } = require('../utils/response.util');
const { sendPhoneChangeOtpEmail } = require('../../../services/email.service');

// Mirror the signup OTP timings so the user experience is consistent.
// Email-OTP confirms the user controls the email tied to the account
// before allowing a phone-number change — same security guarantee as
// "send a code to your email to confirm a sensitive change" used by
// banks. We deliberately do not send the OTP to the NEW phone (no SMS
// infrastructure) — we send it to the user's already-verified email.
const OTP_FORMAT_REGEX = /^[0-9]{6}$/;
const OTP_TTL_MS = Math.max(Number(config.signupOtpTtlMs) || 5 * 60 * 1000, 1);
const OTP_RESEND_COOLDOWN_MS = Math.max(Number(config.signupOtpResendCooldownMs) || 30 * 1000, 1);
const OTP_MAX_VERIFY_ATTEMPTS = Math.max(Number(config.signupOtpMaxVerifyAttempts) || 5, 1);
const OTP_MAX_RESENDS = Math.max(Number(config.signupOtpMaxResends) || 5, 0);

const resolveFixedOtpCode = () => {
  const configuredOtp = config.signupTestOtp || config.signupOtp;
  if (!configuredOtp) return null;
  const normalized = String(configuredOtp).trim();
  return OTP_FORMAT_REGEX.test(normalized) ? normalized : null;
};
const FIXED_OTP_CODE = resolveFixedOtpCode();

const generateOtp = () => {
  if (FIXED_OTP_CODE) return FIXED_OTP_CODE;
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
};

const getState = (session) => session[PHONE_CHANGE_SESSION_KEY];
const setState = (session, state) => { session[PHONE_CHANGE_SESSION_KEY] = state; };
const clearState = (session) => { delete session[PHONE_CHANGE_SESSION_KEY]; };

const normalizePhone = (value) => String(value || '').trim();
const PHONE_REGEX = /^[0-9+]{7,15}$/;

const startPhoneChange = async ({ newPhone }, session, userId) => {
  const trimmedPhone = normalizePhone(newPhone);
  if (!PHONE_REGEX.test(trimmedPhone)) {
    throw createError(400, 'Mobile number must be 7-15 digits and may start with +');
  }

  const user = await User.findById(userId).select('email firstName lastName displayName phone');
  if (!user) {
    throw createError(404, 'User not found');
  }

  if (!user.email) {
    throw createError(409, 'Your account has no email on file. Contact support to change your mobile number.');
  }

  if (user.phone && user.phone === trimmedPhone) {
    throw createError(400, 'The new mobile number is the same as the current one');
  }

  const existing = await User.findOne({ phone: trimmedPhone, _id: { $ne: userId } }).select('_id');
  if (existing) {
    throw createError(409, 'This mobile number is already linked to another account');
  }

  const currentState = getState(session);
  const sameNewPhone = currentState && currentState.newPhone === trimmedPhone;

  if (sameNewPhone && currentState.lastOtpSentAt) {
    const elapsedMs = Date.now() - currentState.lastOtpSentAt;
    if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.max(1, Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000));
      throw createError(429, `Please wait ${remainingSeconds} seconds before requesting another code`);
    }
  }

  if (sameNewPhone && (currentState.resendCount || 0) >= OTP_MAX_RESENDS) {
    throw createError(429, 'Maximum OTP resend attempts reached. Please try again later.');
  }

  const otp = generateOtp();
  const displayName = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'there';

  const emailResult = await sendPhoneChangeOtpEmail({
    to: user.email,
    fullName: displayName,
    otp,
    newPhone: trimmedPhone,
    expiresInMs: OTP_TTL_MS
  });

  if (!emailResult?.success) {
    throw createError(502, emailResult?.errorMessage || 'Unable to send verification email');
  }

  const now = Date.now();
  setState(session, {
    userId: String(userId),
    newPhone: trimmedPhone,
    otp,
    otpExpiresAt: now + OTP_TTL_MS,
    lastOtpSentAt: now,
    resendCount: sameNewPhone ? (currentState.resendCount || 0) + 1 : 0,
    verifyAttempts: 0
  });

  return {
    message: sameNewPhone ? 'A new verification code has been sent to your email' : 'Verification code sent to your email',
    expiresInMs: OTP_TTL_MS,
    resendAvailableInMs: OTP_RESEND_COOLDOWN_MS,
    emailMasked: maskEmail(user.email)
  };
};

const maskEmail = (email) => {
  const [local, domain] = String(email).split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
};

const verifyPhoneChange = async ({ otp }, session, userId) => {
  const state = getState(session);
  if (!state) {
    throw createError(400, 'Start a phone change before verifying the code');
  }

  if (String(state.userId) !== String(userId)) {
    clearState(session);
    throw createError(400, 'Session mismatch. Please restart the phone change.');
  }

  if (Date.now() > state.otpExpiresAt) {
    clearState(session);
    throw createError(410, 'Verification code has expired. Please request a new one.');
  }

  if ((state.verifyAttempts || 0) >= OTP_MAX_VERIFY_ATTEMPTS) {
    clearState(session);
    throw createError(429, 'Too many invalid attempts. Request a new code.');
  }

  const trimmedOtp = String(otp || '').trim();
  if (!OTP_FORMAT_REGEX.test(trimmedOtp)) {
    state.verifyAttempts = (state.verifyAttempts || 0) + 1;
    setState(session, state);
    throw createError(400, 'Code must be a 6-digit number');
  }

  if (trimmedOtp !== state.otp) {
    state.verifyAttempts = (state.verifyAttempts || 0) + 1;
    setState(session, state);
    if (state.verifyAttempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      throw createError(429, 'Too many invalid attempts. Request a new code.');
    }
    throw createError(400, 'Invalid code');
  }

  // Double-check uniqueness right before commit — covers the race where
  // another user claimed this phone during the OTP window.
  const conflict = await User.findOne({ phone: state.newPhone, _id: { $ne: userId } }).select('_id');
  if (conflict) {
    clearState(session);
    throw createError(409, 'This mobile number is already linked to another account');
  }

  const user = await User.findById(userId);
  if (!user) {
    clearState(session);
    throw createError(404, 'User not found');
  }

  user.phone = state.newPhone;
  await user.save({ validateBeforeSave: false });
  clearState(session);

  return buildUserResponse(user);
};

module.exports = {
  startPhoneChange,
  verifyPhoneChange
};
