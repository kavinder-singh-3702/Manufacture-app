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

const toPlainObject = (value) => {
  if (!value) return {};
  if (typeof value.toObject === 'function') {
    return value.toObject();
  }
  return value;
};

const cleanObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
};

const updateCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(createError(404, 'User not found'));
    }

    const assignField = (field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        user[field] = req.body[field];
      }
    };

    ['firstName', 'lastName', 'displayName', 'phone', 'bio'].forEach(assignField);

    if (Object.prototype.hasOwnProperty.call(req.body, 'activityTags')) {
      user.activityTags = Array.isArray(req.body.activityTags)
        ? req.body.activityTags.filter((tag) => typeof tag === 'string' && tag.trim().length)
        : user.activityTags;
    }

    if (req.body.address) {
      const cleanedAddress = cleanObject(req.body.address);
      user.address =
        Object.keys(cleanedAddress).length > 0 ? { ...toPlainObject(user.address), ...cleanedAddress } : undefined;
    }

    if (req.body.socialLinks) {
      const cleanedLinks = cleanObject(req.body.socialLinks);
      user.socialLinks =
        Object.keys(cleanedLinks).length > 0 ? { ...toPlainObject(user.socialLinks), ...cleanedLinks } : undefined;
    }

    if (req.body.preferences && typeof req.body.preferences === 'object') {
      const nextPreferences = {
        ...toPlainObject(user.preferences),
        ...cleanObject(req.body.preferences),
      };

      if (req.body.preferences.communications && typeof req.body.preferences.communications === 'object') {
        nextPreferences.communications = {
          ...toPlainObject(user.preferences?.communications),
          ...req.body.preferences.communications,
        };
      }

      user.preferences = nextPreferences;
    }

    await user.save();

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCurrentUser,
  updateCurrentUser
};
