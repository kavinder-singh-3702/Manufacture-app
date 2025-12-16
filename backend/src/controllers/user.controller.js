const createError = require('http-errors');
const User = require('../models/user.model');
const { uploadUserDocument } = require('../services/storage.service');
const { ACTIVITY_ACTIONS } = require('../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../modules/activity/services/activity.service');

const sanitizeUser = (user) => {
  const { password, __v, ...rest } = user.toObject({ versionKey: false });
  // Add 'id' field for frontend compatibility (frontend expects 'id', MongoDB uses '_id')
  return {
    ...rest,
    id: rest._id?.toString() || rest._id,
  };
};

const TEST_ADMIN_OBJECT_ID = '000000000000000000000001';

const getCurrentUser = async (req, res, next) => {
  try {
    // ============ TEST ADMIN BYPASS - REMOVE AFTER TESTING ============
    if (req.user.id === TEST_ADMIN_OBJECT_ID) {
      return res.json({
        user: {
          id: TEST_ADMIN_OBJECT_ID,
          _id: TEST_ADMIN_OBJECT_ID,
          email: 'admin@example.com',
          phone: '+15551234567',
          firstName: 'Jane',
          lastName: 'Admin',
          displayName: 'Jane Admin',
          role: 'admin',
          status: 'active',
          accountType: 'manufacturer',
          verificationStatus: 'verified',
          activeCompany: null,
          companies: [],
        }
      });
    }
    // ============ END TEST ADMIN BYPASS ============

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

    ['firstName', 'lastName', 'displayName', 'phone', 'bio', 'avatarUrl'].forEach(assignField);

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

    const updatedFields = Object.keys(req.body || {});
    await recordActivitySafe({
      userId: user.id,
      action: ACTIVITY_ACTIONS.USER_PROFILE_UPDATED,
      label: 'Profile updated',
      description: updatedFields.length ? `Updated ${updatedFields.join(', ')}` : 'Updated profile details',
      meta: { fields: updatedFields },
      companyId: user.activeCompany,
      context: extractRequestContext(req)
    });

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

const uploadUserFile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    const { fileName, mimeType, content, purpose } = req.body;
    const file = await uploadUserDocument({
      userId: user.id,
      purpose: purpose?.trim().toLowerCase() || 'general',
      fileName,
      mimeType,
      base64: content
    });

    if (purpose === 'avatar') {
      user.avatarUrl = file.url;
      await user.save();
    }

    await recordActivitySafe({
      userId: user.id,
      action: ACTIVITY_ACTIONS.USER_FILE_UPLOADED,
      label: 'File uploaded',
      description: purpose === 'avatar' ? 'Updated profile avatar' : `Uploaded ${purpose || 'file'}`,
      meta: { fileName, mimeType, purpose },
      companyId: user.activeCompany,
      context: extractRequestContext(req)
    });

    return res.status(201).json({ file });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  uploadUserFile
};
