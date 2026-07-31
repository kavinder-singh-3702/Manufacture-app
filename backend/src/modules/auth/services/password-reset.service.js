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
const PASSWORD_RESET_MAX_ATTEMPTS = Math.max(1, Number(config.passwordResetMaxAttempts) || 5);
const PASSWORD_RESET_RESEND_COOLDOWN_MS = Math.max(1, Number(config.passwordResetResendCooldownMs) || 30 * 1000);
const PASSWORD_RESET_MAX_RESENDS = Math.max(0, Number(config.passwordResetMaxResends) || 5);
const CODE_FORMAT_REGEX = /^[0-9]{6}$/;

const generateResetToken = () => crypto.randomBytes(32).toString('hex');
const generateResetCode = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');
const hashResetSecret = (value) => crypto.createHash('sha256').update(value).digest('hex');

// Enumeration-safe: this exact shape is returned whether or not the email
// belongs to a real account, so a caller can't use response differences to
// discover which emails are registered.
const buildGenericResponse = () => ({
  channel: 'email',
  message: "If an account exists for this email, reset instructions have been sent to your inbox.",
  expiresInMs: PASSWORD_RESET_TOKEN_TTL_MS,
  resendAvailableInMs: PASSWORD_RESET_RESEND_COOLDOWN_MS
});

const requestPasswordReset = async (req, { email }) => {
  const response = buildGenericResponse();

  if (!email) {
    return response;
  }

  // Fail loudly and BEFORE the user lookup when SMTP isn't configured, so a
  // broken mail transport doesn't quietly return "check your inbox" for an
  // email that was never sent — the bug this flow shipped with once
  // already. Checking before the lookup also means the failure itself
  // can't be used to distinguish a real account from an unknown one.
  if (!config.smtpUser || !config.smtpPass) {
    throw createError(503, 'Email delivery is not configured. Please contact support.');
  }

  const user = await User.findOne({ email });

  if (!user) {
    return response;
  }

  const now = Date.now();
  if (user.passwordResetLastSentAt) {
    const elapsed = now - new Date(user.passwordResetLastSentAt).getTime();
    if (elapsed < PASSWORD_RESET_RESEND_COOLDOWN_MS) {
      const remainingMs = PASSWORD_RESET_RESEND_COOLDOWN_MS - elapsed;
      throw createError(429, `Please wait ${Math.ceil(remainingMs / 1000)} seconds before requesting another code`);
    }
  }

  const isFreshRequest = !user.passwordResetExpires || user.passwordResetExpires <= new Date(now);
  const resendCount = isFreshRequest ? 0 : (user.passwordResetResendCount || 0) + 1;
  if (resendCount > PASSWORD_RESET_MAX_RESENDS) {
    throw createError(429, 'Maximum reset code resends reached. Please try again later.');
  }

  const plainToken = generateResetToken();
  const plainCode = generateResetCode();
  user.passwordResetToken = hashResetSecret(plainToken);
  user.passwordResetCode = hashResetSecret(plainCode);
  user.passwordResetExpires = new Date(now + PASSWORD_RESET_TOKEN_TTL_MS);
  user.passwordResetAttempts = 0;
  user.passwordResetLastSentAt = new Date(now);
  user.passwordResetResendCount = resendCount;
  await user.save({ validateBeforeSave: false });

  if (config.node !== 'production') {
    response.resetCode = plainCode;
    response.resetToken = plainToken;
    response.expiresAt = user.passwordResetExpires;
  }

  // Send both credentials by email — a tappable link for one-click reset on
  // web/desktop, and a short code for the in-app flow (mobile has no
  // universal-link plumbing until the app is rebuilt and released).
  // Fire-and-forget: a slow SMTP send must not stall the client response;
  // email.service already logs failures. SMTP config itself was validated
  // above, so a failure here is a delivery-time issue, not a config gap.
  const displayName = user.displayName || user.firstName || user.email.split('@')[0];
  const resetLink = `${config.appUrl}/reset-password?token=${encodeURIComponent(plainToken)}`;
  setImmediate(() => {
    sendPasswordResetEmail({
      to: user.email,
      fullName: displayName,
      resetCode: plainCode,
      resetLink,
      expiresInMs: PASSWORD_RESET_TOKEN_TTL_MS,
    }).catch((err) => {
      console.error('[PasswordReset] Failed to send reset email:', err?.message || err);
    });
  });

  await recordActivitySafe({
    userId: user.id,
    action: ACTIVITY_ACTIONS.AUTH_PASSWORD_RESET_REQUESTED,
    label: 'Requested password reset',
    meta: { via: 'email' },
    context: extractRequestContext(req)
  });

  return response;
};

const clearResetCredentials = (user) => {
  user.passwordResetToken = undefined;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetAttempts = 0;
  user.passwordResetLastSentAt = undefined;
  user.passwordResetResendCount = 0;
};

const finalizeReset = async (req, user, password) => {
  user.password = password;
  clearResetCredentials(user);
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

// Link path: the token has 256 bits of entropy, so a global lookup on its
// hash is safe — there's no meaningful brute-force surface to scope by user.
const resetPasswordWithToken = async (req, { token, password }) => {
  const hashedToken = hashResetSecret(token.trim());

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    throw createError(400, 'Invalid or expired reset token');
  }

  return finalizeReset(req, user, password);
};

// Code path: a 6-digit code is only ~20 bits of entropy, so it must never be
// looked up globally — it's scoped to the account the user names, with an
// attempt counter that invalidates the credential after too many guesses.
const resetPasswordWithCode = async (req, { email, code, password }) => {
  // passwordResetCode has `select: false` on the schema, so it must be
  // requested explicitly — a plain findOne would leave it undefined and
  // make every code comparison fail closed.
  const user = await User.findOne({ email }).select('+passwordResetCode');

  if (!user || !user.passwordResetCode || !user.passwordResetExpires) {
    throw createError(400, 'Invalid or expired reset code');
  }

  // Expiry and lockout are read-only checks — no need to mutate the
  // document here. Expiry only ever moves forward in time, and a locked-out
  // code stays locked (attempts only resets via a fresh requestPasswordReset
  // call), so every subsequent call keeps failing consistently on its own
  // without a write. This also means a code lockout never touches
  // passwordResetToken, so the emailed link stays valid independently.
  if (user.passwordResetExpires <= new Date()) {
    throw createError(410, 'That reset code has expired. Please request a new one.');
  }

  if (user.passwordResetAttempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
    throw createError(429, 'Too many incorrect attempts. Please request a new reset code.');
  }

  const hashedCode = hashResetSecret(code.trim());
  if (hashedCode !== user.passwordResetCode) {
    user.passwordResetAttempts += 1;
    const lockedOut = user.passwordResetAttempts >= PASSWORD_RESET_MAX_ATTEMPTS;
    await user.save({ validateBeforeSave: false });
    // The attempt that reaches the cap reports the lockout immediately,
    // rather than making the caller spend one more guess just to discover
    // it's locked (mirrors signup.service.js's OTP lockout behavior).
    if (lockedOut) {
      throw createError(429, 'Too many incorrect attempts. Please request a new reset code.');
    }
    throw createError(400, 'Invalid or expired reset code');
  }

  return finalizeReset(req, user, password);
};

const resetPassword = async (req, { token, email, code, password }) => {
  if (token) {
    return resetPasswordWithToken(req, { token, password });
  }

  if (email && code && CODE_FORMAT_REGEX.test(code.trim())) {
    return resetPasswordWithCode(req, { email, code, password });
  }

  throw createError(400, 'A reset token or an email + reset code is required');
};

module.exports = {
  requestPasswordReset,
  resetPassword
};
