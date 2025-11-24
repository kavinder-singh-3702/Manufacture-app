const { query } = require('express-validator');

const activityQueryValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('companyId').optional().isString().trim(),
  query('action').optional().isString().trim()
];

module.exports = {
  activityQueryValidation
};
