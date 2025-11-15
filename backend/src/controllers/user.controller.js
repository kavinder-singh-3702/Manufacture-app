const createError = require('http-errors');
const User = require('../models/user.model');

const sanitizeUser = (user) => {
  const { password, __v, ...rest } = user.toObject({ versionKey: false });
  return rest;
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(createError(404, 'User not found'));
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

const updateCurrentUser = async (req, res, next) => {
  try {
    const allowedFields = [
      'firstName',
      'lastName',
      'phone',
      'company',
      'contact',
      'productsOffered',
      'servicesOffered',
      'categories'
    ];

    const updatePayload = {};

    allowedFields.forEach((field) => {
      if (typeof req.body[field] !== 'undefined') {
        updatePayload[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updatePayload, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return next(createError(404, 'User not found'));
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCurrentUser,
  updateCurrentUser
};
