const createError = require('http-errors');
const mongoose = require('mongoose');
const Report = require('../../../models/report.model');
const Product = require('../../../models/product.model');
const ChatMessage = require('../../../models/chatMessage.model');
const User = require('../../../models/user.model');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Resolve who owns the reported target so admin queue rows can jump
// straight to the accountable party.
const resolveTargetOwner = async (targetType, targetId) => {
  if (targetType === 'product') {
    const product = await Product.findById(targetId).select('createdBy').lean();
    return product?.createdBy || null;
  }
  if (targetType === 'message') {
    const msg = await ChatMessage.findById(targetId).select('sender').lean();
    return msg?.sender || null;
  }
  if (targetType === 'user') {
    // Self-referential — the reported user IS the owner.
    return targetId;
  }
  return null;
};

const assertTargetExists = async (targetType, targetId) => {
  const collection =
    targetType === 'product'
      ? Product
      : targetType === 'message'
        ? ChatMessage
        : targetType === 'user'
          ? User
          : null;
  if (!collection) throw createError(400, 'Unsupported target type');
  const exists = await collection.exists({ _id: targetId });
  if (!exists) throw createError(404, `${targetType} not found`);
};

const createReport = async ({ reporter, targetType, targetId, reason, details }) => {
  await assertTargetExists(targetType, targetId);

  // Reporter can't report themselves.
  if (targetType === 'user' && targetId.toString() === reporter.toString()) {
    throw createError(400, 'You cannot report yourself.');
  }

  const targetOwner = await resolveTargetOwner(targetType, targetId);

  try {
    const report = await Report.create({
      reporter,
      targetType,
      targetId,
      targetOwner,
      reason,
      details: typeof details === 'string' ? details.trim() : undefined,
    });
    return report.toObject();
  } catch (err) {
    // Compound unique index blocks duplicate pending reports from the
    // same reporter for the same target. Surface a friendly message.
    if (err?.code === 11000) {
      throw createError(409, 'You have already reported this — an admin is reviewing it.');
    }
    throw err;
  }
};

const listReports = async ({ status, targetType, limit = 25, offset = 0 } = {}) => {
  const safeLimit = clamp(parseNumber(limit, 25), 1, 100);
  const safeOffset = Math.max(parseNumber(offset, 0), 0);

  const query = {};
  if (status) query.status = status;
  if (targetType) query.targetType = targetType;

  const [reports, total, pendingCount] = await Promise.all([
    Report.find(query)
      .sort({ createdAt: -1 })
      .skip(safeOffset)
      .limit(safeLimit)
      .populate('reporter', 'displayName email role')
      .populate('targetOwner', 'displayName email role')
      .populate('resolvedBy', 'displayName email')
      .lean(),
    Report.countDocuments(query),
    Report.countDocuments({ status: 'pending' }),
  ]);

  return {
    reports: reports.map((r) => ({
      id: r._id.toString(),
      reporter: r.reporter,
      targetType: r.targetType,
      targetId: r.targetId,
      targetOwner: r.targetOwner,
      reason: r.reason,
      details: r.details,
      status: r.status,
      resolvedBy: r.resolvedBy,
      resolvedAt: r.resolvedAt,
      resolutionNotes: r.resolutionNotes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    pagination: {
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + reports.length < total,
    },
    counters: {
      pending: pendingCount,
    },
  };
};

const resolveReport = async ({ reportId, adminId, action, notes }) => {
  if (!['resolved', 'dismissed'].includes(action)) {
    throw createError(400, 'Action must be resolved or dismissed');
  }
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    throw createError(400, 'Invalid report id');
  }
  const report = await Report.findById(reportId);
  if (!report) throw createError(404, 'Report not found');
  if (report.status !== 'pending') {
    throw createError(409, `Report is already ${report.status}`);
  }

  report.status = action;
  report.resolvedBy = adminId;
  report.resolvedAt = new Date();
  if (typeof notes === 'string' && notes.trim().length) {
    report.resolutionNotes = notes.trim();
  }
  await report.save();
  return report.toObject();
};

module.exports = {
  createReport,
  listReports,
  resolveReport,
};
