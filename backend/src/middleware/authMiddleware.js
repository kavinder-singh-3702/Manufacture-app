const createError = require('http-errors');
const User = require('../models/user.model');
const { verifyToken } = require('../utils/token');
const { roleSatisfies } = require('../utils/roles');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [, bearerToken] = authHeader.split(' ');

    let userId = null;

    if (bearerToken) {
      const payload = verifyToken(bearerToken);
      userId = payload.sub;
    } else if (req.session && req.session.userId) {
      userId = req.session.userId;
    }

    if (!userId) {
      return next(createError(401, 'Authentication required'));
    }

    const user = await User.findById(userId).lean();

    if (!user || (user.status && user.status !== 'active')) {
      return next(createError(401, 'User not found or inactive'));
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      role: user.role || 'user',
      email: user.email,
      verificationStatus: user.verificationStatus,
      activeCompany: user.activeCompany
    };

    return next();
  } catch (error) {
    return next(createError(401, 'Invalid or expired token'));
  }
};

const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [, bearerToken] = authHeader.split(' ');

    let userId = null;

    if (bearerToken) {
      try {
        const payload = verifyToken(bearerToken);
        userId = payload.sub;
      } catch (error) {
        // Ignore invalid tokens for optional auth.
      }
    }

    if (!userId && req.session && req.session.userId) {
      userId = req.session.userId;
    }

    if (!userId) {
      return next();
    }

    const user = await User.findById(userId).lean();

    if (!user || (user.status && user.status !== 'active')) {
      return next();
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      role: user.role || 'user',
      email: user.email,
      verificationStatus: user.verificationStatus,
      activeCompany: user.activeCompany
    };

    return next();
  } catch (error) {
    return next();
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roleSatisfies(req.user.role, roles)) {
    return next(createError(403, 'You are not allowed to perform this action'));
  }
  return next();
};

module.exports = {
  authenticate,
  authenticateOptional,
  authorizeRoles
};
