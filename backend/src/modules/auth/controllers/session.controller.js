const { loginWithPassword, logout } = require('../services/session-auth.service');
const { signToken } = require('../../../utils/token');

const loginUser = async (req, res, next) => {
  try {
    const user = await loginWithPassword(req, req.body);
    // Generate JWT token for mobile clients that can't use session cookies
    const token = signToken({ _id: user.id || user._id, role: user.role });
    return res.json({ user, token });
  } catch (error) {
    return next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const cookieName = await logout(req);
    res.clearCookie(cookieName);
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  loginUser,
  logoutUser
};
