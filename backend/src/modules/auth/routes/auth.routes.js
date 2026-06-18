const { Router } = require('express');
const { createAdmin } = require('../controllers/admin.controller');
const { beginSignup, verifyOtp, saveContact, finalizeSignup } = require('../controllers/signup.controller');
const {
  loginUser,
  logoutUser,
  updatePhoneController,
  startPhoneChangeController,
  verifyPhoneChangeController
} = require('../controllers/session.controller');
const { appleSignInController } = require('../controllers/appleSignIn.controller');
const {
  requestPasswordResetController,
  resetPasswordController
} = require('../controllers/password.controller');
const validate = require('../../../middleware/validate');
const { authenticate } = require('../../../middleware/authMiddleware');
const {
  signupStartValidation,
  signupVerifyValidation,
  signupContactValidation,
  signupCompleteValidation,
  adminCreateValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  phoneChangeStartValidation,
  phoneChangeVerifyValidation
} = require('../validators/auth.validators');

const router = Router();

router.post('/admin', validate(adminCreateValidation), createAdmin);
router.post('/signup/start', validate(signupStartValidation), beginSignup);
router.post('/signup/verify', validate(signupVerifyValidation), verifyOtp);
router.post('/signup/contact', validate(signupContactValidation), saveContact);
router.post('/signup/complete', validate(signupCompleteValidation), finalizeSignup);
router.post('/login', validate(loginValidation), loginUser);
router.post('/apple', appleSignInController);
router.post('/logout', logoutUser);
router.post('/password/forgot', validate(forgotPasswordValidation), requestPasswordResetController);
router.post('/password/reset', validate(resetPasswordValidation), resetPasswordController);
router.post('/profile/phone', authenticate, updatePhoneController);
router.post('/profile/phone/change/start', authenticate, validate(phoneChangeStartValidation), startPhoneChangeController);
router.post('/profile/phone/change/verify', authenticate, validate(phoneChangeVerifyValidation), verifyPhoneChangeController);

// Public — returns the canonical support-admin user id used by the
// frontend SupportFab to start support conversations. Sourced from
// PRIMARY_SUPPORT_ADMIN_ID env var; falls back to the oldest admin user.
// Replaces the hardcoded stub id that the frontend used to ship with.
router.get('/support-admin', async (req, res, next) => {
  try {
    const envId = process.env.PRIMARY_SUPPORT_ADMIN_ID;
    const User = require('../../../models/user.model');
    if (envId) {
      const exists = await User.findById(envId).select('_id').lean();
      if (exists) return res.json({ supportAdminId: String(exists._id) });
    }
    const fallback = await User.findOne({ role: { $in: ['admin', 'super-admin'] } })
      .sort({ createdAt: 1 })
      .select('_id')
      .lean();
    if (!fallback) {
      return res.status(503).json({ message: 'No support admin available on this instance' });
    }
    return res.json({ supportAdminId: String(fallback._id) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
