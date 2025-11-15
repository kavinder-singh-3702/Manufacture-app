const { loginWithPassword, logout } = require('../services/session-auth.service');

const loginUser = async (req, res, next) => {
  try {
    const user = await loginWithPassword(req, req.body);
    return res.json({ user });
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
