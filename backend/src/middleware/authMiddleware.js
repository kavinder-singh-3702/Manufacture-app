const createError = require('http-errors');
const User = require('../models/user.model');
const { verifyToken } = require('../utils/token');

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

    // ============ TEST ADMIN BYPASS - REMOVE AFTER TESTING ============
    // This allows the test admin to authenticate without being in the database
    if (userId === 'test-admin-id') {
      req.user = {
        id: 'test-admin-id',
        role: 'admin',
        email: 'admin@example.com',
        phone: '+15551234567',
        verificationStatus: 'verified'
      };
      return next();
    }
    // ============ END TEST ADMIN BYPASS ============

    const user = await User.findById(userId).lean();

    if (!user || (user.status && user.status !== 'active')) {
      return next(createError(401, 'User not found or inactive'));
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      role: user.role,
      email: user.email,
      verificationStatus: user.verificationStatus,
      activeCompany: user.activeCompany
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
