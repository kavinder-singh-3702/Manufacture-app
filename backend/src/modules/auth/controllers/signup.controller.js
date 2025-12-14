const {
  startSignup,
  verifySignupOtp,
  completeSignup
} = require('../services/signup.service');
const { signToken } = require('../../../utils/token');

const beginSignup = async (req, res, next) => {
  try {
    const result = await startSignup(req.body, req.session);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const result = await verifySignupOtp(req.body, req.session);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const finalizeSignup = async (req, res, next) => {
  try {
    const user = await completeSignup(req.body, req);
    // Generate JWT token for mobile clients that can't use session cookies
    const token = signToken({ _id: user.id || user._id, role: user.role });
    return res.status(201).json({ user, token });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  beginSignup,
  verifyOtp,
  finalizeSignup
};
