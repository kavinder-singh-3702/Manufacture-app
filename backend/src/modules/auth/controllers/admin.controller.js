const { createAdminAccount } = require('../services/admin.service');

const createAdmin = async (req, res, next) => {
  try {
    const { user, token } = await createAdminAccount(req, req.body);
    return res.status(201).json({ user, token, role: user.role });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createAdmin
};
