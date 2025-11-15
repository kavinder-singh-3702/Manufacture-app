const createError = require('http-errors');
const User = require('../models/user.model');
const { verifyToken } = require('../utils/token');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');

    if (!token) {
      return next(createError(401, 'Authentication token missing'));
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).lean();

    if (!user || !user.isActive) {
      return next(createError(401, 'User not found or inactive'));
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      verificationStatus: user.verificationStatus
    };

    return next();
  } catch (error) {
    return next(createError(401, 'Invalid or expired token'));
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(createError(403, 'You are not allowed to perform this action'));
  }
  return next();
};

module.exports = {
  authenticate,
  authorizeRoles
};
