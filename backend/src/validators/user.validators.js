const { body } = require('express-validator');

const updateProfileValidation = [
  body('firstName').optional().isString().withMessage('First name must be a string'),
  body('lastName').optional().isString(),
  body('phone').optional().isString(),
  body('company').optional().isObject(),
  body('contact').optional().isObject(),
  body('productsOffered').optional().isArray(),
  body('servicesOffered').optional().isArray(),
  body('categories').optional().isArray()
];

module.exports = {
  updateProfileValidation
};
