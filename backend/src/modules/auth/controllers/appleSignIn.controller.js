const { signInWithApple } = require('../services/appleSignIn.service');
const { signToken } = require('../../../utils/token');

const appleSignInController = async (req, res, next) => {
  try {
    const user = await signInWithApple(req, req.body);
    const token = signToken({ _id: user.id || user._id, role: user.role });
    return res.json({ user, token });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  appleSignInController,
};
