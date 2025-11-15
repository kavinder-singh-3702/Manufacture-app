const jwt = require('jsonwebtoken');
const config = require('../config/env');

const buildPayload = (user) => ({
  sub: user._id.toString(),
  role: user.role
});

const signToken = (user) => {
  return jwt.sign(buildPayload(user), config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

module.exports = {
  signToken,
  verifyToken
};
