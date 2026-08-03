const createError = require("http-errors");
const {
  loginWithPassword,
  logout,
} = require("../services/session-auth.service");
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

// Socket.IO's handshake (backend/src/socket/index.js) only accepts a bearer
// JWT, never the session cookie — so a web client that's authenticated
// purely by cookie (the normal web-frontend flow; it discards the JWT the
// /login response includes) had no credential it could hand the socket at
// all, and the realtime notification/chat events never reached the browser.
// This works for either auth style since it sits behind `authenticate`
// (cookie or bearer), and mints a short-lived token scoped just for the
// handshake rather than reusing the long-lived (7d) session token.
const getRealtimeTokenController = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      throw createError(401, "Authentication required");
    }

    const token = signToken({ _id: userId, role: req.user.role }, { expiresIn: "15m" });
    return res.json({ token });
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

module.exports = {
  loginUser,
  logoutUser,
  getRealtimeTokenController,
  updatePhoneController,
};
