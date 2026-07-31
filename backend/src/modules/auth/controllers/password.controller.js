const { requestPasswordReset, resetPassword } = require('../services/password-reset.service');

const requestPasswordResetController = async (req, res, next) => {
  try {
    const payload = await requestPasswordReset(req, {
      email: req.body.email?.trim()
    });
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    const user = await resetPassword(req, {
      token: req.body.token?.trim(),
      email: req.body.email?.trim(),
      code: req.body.code?.trim(),
      password: req.body.password
    });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requestPasswordResetController,
  resetPasswordController
};
