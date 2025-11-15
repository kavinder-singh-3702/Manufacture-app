const { Router } = require('express');
const { beginSignup, verifyOtp, finalizeSignup } = require('../controllers/signup.controller');
const { loginUser, logoutUser } = require('../controllers/session.controller');
const validate = require('../../../middleware/validate');
const {
  signupStartValidation,
  signupVerifyValidation,
  signupCompleteValidation,
  loginValidation
} = require('../validators/auth.validators');

const router = Router();

router.post('/signup/start', validate(signupStartValidation), beginSignup);
router.post('/signup/verify', validate(signupVerifyValidation), verifyOtp);
router.post('/signup/complete', validate(signupCompleteValidation), finalizeSignup);
router.post('/login', validate(loginValidation), loginUser);
router.post('/logout', logoutUser);

module.exports = router;
