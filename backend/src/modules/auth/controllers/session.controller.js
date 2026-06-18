const createError = require("http-errors");
const {
  loginWithPassword,
  logout,
} = require("../services/session-auth.service");
const {
  startPhoneChange,
  verifyPhoneChange
} = require("../services/phoneChange.service");
const { signToken } = require("../../../utils/token");
const User = require("../../../models/user.model");
const { buildUserResponse } = require("../utils/response.util");

const loginUser = async (req, res, next) => {
  try {
    const user = await loginWithPassword(req, req.body);
    // Generate JWT token for mobile clients that can't use session cookies
    const token = signToken({ _id: user.id || user._id, role: user.role });
    return res.json({ user, token });
  } catch (error) {
    return next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const cookieName = await logout(req);
    res.clearCookie(cookieName);
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
};

const updatePhoneController = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      throw createError(401, "Authentication required");
    }

    const rawPhone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
    if (!/^[0-9+]{7,15}$/.test(rawPhone)) {
      throw createError(400, "Mobile number must be 7-15 digits and may start with +");
    }

    const existing = await User.findOne({ phone: rawPhone, _id: { $ne: userId } }).select("_id");
    if (existing) {
      throw createError(409, "This mobile number is already linked to another account");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw createError(404, "User not found");
    }

    user.phone = rawPhone;
    await user.save({ validateBeforeSave: false });

    return res.json(buildUserResponse(user));
  } catch (error) {
    return next(error);
  }
};

const startPhoneChangeController = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) throw createError(401, "Authentication required");
    const result = await startPhoneChange(req.body, req.session, userId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const verifyPhoneChangeController = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) throw createError(401, "Authentication required");
    const user = await verifyPhoneChange(req.body, req.session, userId);
    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  loginUser,
  logoutUser,
  updatePhoneController,
  startPhoneChangeController,
  verifyPhoneChangeController,
};
