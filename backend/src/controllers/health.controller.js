const config = require('../config/env');

const getHealthStatus = (req, res) => {
  return res.json({
    status: 'ok',
    message: 'Manufacture API is running',
    environment: config.node,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealthStatus
};
