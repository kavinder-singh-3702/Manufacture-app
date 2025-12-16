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
    // Using a valid ObjectId format for compatibility with MongoDB queries
    const TEST_ADMIN_OBJECT_ID = '000000000000000000000001';
    // Handle both old sessions ('test-admin-id') and new sessions (valid ObjectId)
    if (userId === 'test-admin-id' || userId === TEST_ADMIN_OBJECT_ID) {
      req.user = {
        id: TEST_ADMIN_OBJECT_ID,
        _id: TEST_ADMIN_OBJECT_ID,
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
