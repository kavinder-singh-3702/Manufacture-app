const createError = require('http-errors');
const mongoose = require('mongoose');
const User = require('../../../models/user.model');
const Company = require('../../../models/company.model');
const CompanyVerificationRequest = require('../../../models/companyVerificationRequest.model');
const Activity = require('../../../models/activity.model');
const Notification = require('../../../models/notification.model');
const { UserPersonalizedOffer } = require('../../../models/userPersonalizedOffer.model');
const Product = require('../../../models/product.model');
const ProductVariant = require('../../../models/productVariant.model');
const ServiceRequest = require('../../../models/serviceRequest.model');
const ChatConversation = require('../../../models/chatConversation.model');
const CallLog = require('../../../models/callLog.model');
const ProductQuote = require('../../../models/productQuote.model');
const Unit = require('../../../models/unit.model');
const Account = require('../../../models/account.model');
const AccountingVoucherLog = require('../../../models/accountingVoucherLog.model');
const StockMove = require('../../../models/stockMove.model');
const InventoryBalance = require('../../../models/inventoryBalance.model');
const LedgerPosting = require('../../../models/ledgerPosting.model');
const AccountingBill = require('../../../models/accountingBill.model');
const Party = require('../../../models/party.model');
const AccountingVoucher = require('../../../models/accountingVoucher.model');
const AccountingSequence = require('../../../models/accountingSequence.model');
const { sendDocumentRequestEmail } = require('../../../services/email.service');
const { createDocumentRequestNotification } = require('../../../services/notification.service');

const HARD_DELETE_JOB_STORE = new Map();

const toObjectId = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  return undefined;
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resolveSort = (sortValue, fallback = { createdAt: -1 }) => {
  switch (sortValue) {
    case 'createdAt:asc':
      return { createdAt: 1 };
    case 'createdAt:desc':
      return { createdAt: -1 };
    case 'updatedAt:asc':
      return { updatedAt: 1 };
    case 'updatedAt:desc':
      return { updatedAt: -1 };
    default:
      return fallback;
  }
};

const shapeCompanySummary = (company) => ({
  id: company._id.toString(),
  displayName: company.displayName,
  legalName: company.legalName,
  type: company.type,
  status: company.status || 'pending-verification',
  complianceStatus: company.complianceStatus,
  categories: company.categories || [],
  logoUrl: company.logoUrl,
  owner: company.owner
    ? {
      id: company.owner._id?.toString(),
      displayName: company.owner.displayName,
      email: company.owner.email
    }
    : null,
  documentsRequestedAt: company.documentsRequestedAt,
  archivedAt: company.archivedAt,
  archivedBy: company.archivedBy,
  deactivatedReason: company.deactivatedReason,
  createdAt: company.createdAt,
  updatedAt: company.updatedAt
});

const shapeUserSummary = (user) => {
  if (!user) return null;
  return {
    id: user._id?.toString?.() || user.id,
    email: user.email,
    displayName: user.displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role || 'user',
    status: user.status || 'active',
    accountType: user.accountType,
    verificationStatus: user.verificationStatus,
    lastLoginAt: user.lastLoginAt,
    activeCompany: user.activeCompany,
    companies: user.companies,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Get admin dashboard statistics
 * Returns counts for users, companies, and verification requests
 */
const getAdminStats = async () => {
  const [
    totalUsers,
    activeUsers,
    totalCompanies,
    activeCompanies,
    pendingVerifications,
    approvedVerifications,
    rejectedVerifications
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ status: 'active' }),
    Company.countDocuments({}),
    Company.countDocuments({ status: 'active' }),
    CompanyVerificationRequest.countDocuments({ status: 'pending' }),
    CompanyVerificationRequest.countDocuments({ status: 'approved' }),
    CompanyVerificationRequest.countDocuments({ status: 'rejected' })
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [verificationsToday, usersToday] = await Promise.all([
    CompanyVerificationRequest.countDocuments({
      createdAt: { $gte: todayStart }
    }),
    User.countDocuments({
      createdAt: { $gte: todayStart }
    })
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers
    },
    companies: {
      total: totalCompanies,
      active: activeCompanies
    },
    verifications: {
      pending: pendingVerifications,
      approved: approvedVerifications,
      rejected: rejectedVerifications,
      total: pendingVerifications + approvedVerifications + rejectedVerifications
    },
    today: {
      newVerifications: verificationsToday,
      newUsers: usersToday
    }
  };
};

const getAdminOverview = async () => {
  const stats = await getAdminStats();

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

  const [
    pendingLt24h,
    pending24To72h,
    pendingGt72h,
    recentNotifications,
    deliveredNotifications,
    failedNotifications,
    pendingServices,
    inProgressServices,
    overdueServices,
    unresolvedServices,
    recentConversations,
    recentCalls,
    totalCallDurationSeconds,
    activeCampaigns,
    draftCampaigns,
    expiredCampaigns,
    archivedCampaigns
  ] = await Promise.all([
    CompanyVerificationRequest.countDocuments({ status: 'pending', createdAt: { $gte: twentyFourHoursAgo } }),
    CompanyVerificationRequest.countDocuments({
      status: 'pending',
      createdAt: { $lt: twentyFourHoursAgo, $gte: seventyTwoHoursAgo }
    }),
    CompanyVerificationRequest.countDocuments({ status: 'pending', createdAt: { $lt: seventyTwoHoursAgo } }),
    Notification.countDocuments({ createdAt: { $gte: twentyFourHoursAgo }, createdBy: { $exists: true } }),
    Notification.countDocuments({ createdAt: { $gte: twentyFourHoursAgo }, status: 'delivered', createdBy: { $exists: true } }),
    Notification.countDocuments({ createdAt: { $gte: twentyFourHoursAgo }, status: 'failed', createdBy: { $exists: true } }),
    ServiceRequest.countDocuments({ status: 'pending', deletedAt: { $exists: false } }),
    ServiceRequest.countDocuments({
      status: { $in: ['in_review', 'scheduled', 'in_progress'] },
      deletedAt: { $exists: false }
    }),
    ServiceRequest.countDocuments({
      status: { $in: ['pending', 'in_review', 'scheduled', 'in_progress'] },
      slaDueAt: { $lt: now },
      deletedAt: { $exists: false }
    }),
    ServiceRequest.countDocuments({
      status: { $in: ['pending', 'in_review', 'scheduled', 'in_progress'] },
      deletedAt: { $exists: false }
    }),
    ChatConversation.countDocuments({ updatedAt: { $gte: twentyFourHoursAgo } }),
    CallLog.countDocuments({ startedAt: { $gte: twentyFourHoursAgo } }),
    CallLog.aggregate([
      { $match: { startedAt: { $gte: twentyFourHoursAgo } } },
      { $group: { _id: null, totalDuration: { $sum: '$durationSeconds' } } }
    ]).then((rows) => rows[0]?.totalDuration || 0),
    UserPersonalizedOffer.countDocuments({ status: 'active' }),
    UserPersonalizedOffer.countDocuments({ status: 'draft' }),
    UserPersonalizedOffer.countDocuments({ status: 'expired' }),
    UserPersonalizedOffer.countDocuments({ status: 'archived' })
  ]);

  return {
    stats,
    verificationAging: {
      lt24h: pendingLt24h,
      from24hTo72h: pending24To72h,
      gt72h: pendingGt72h
    },
    notificationDispatchHealth: {
      last24h: recentNotifications,
      delivered: deliveredNotifications,
      failed: failedNotifications,
      successRate:
        recentNotifications > 0 ? Number(((deliveredNotifications / recentNotifications) * 100).toFixed(2)) : 0
    },
    campaigns: {
      active: activeCampaigns,
      draft: draftCampaigns,
      expired: expiredCampaigns,
      archived: archivedCampaigns,
      total: activeCampaigns + draftCampaigns + expiredCampaigns + archivedCampaigns
    },
    servicesQueue: {
      pending: pendingServices,
      inProgress: inProgressServices,
      overdue: overdueServices,
      unresolved: unresolvedServices
    },
    communications: {
      conversationsLast24h: recentConversations,
      callsLast24h: recentCalls,
      totalCallDurationSeconds
    }
  };
};

/**
 * List all companies (admin/super-admin)
 */
const listAllCompanies = async ({ status, search, limit = 50, offset = 0, sort } = {}) => {
  const safeLimit = clamp(parseNumber(limit, 50), 1, 100);
  const safeOffset = Math.max(parseNumber(offset, 0), 0);

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { displayName: { $regex: search, $options: 'i' } },
      { legalName: { $regex: search, $options: 'i' } }
    ];
  }

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .populate('owner', 'displayName email')
      .sort(resolveSort(sort, { createdAt: -1 }))
      .skip(safeOffset)
      .limit(safeLimit)
      .lean(),
    Company.countDocuments(filter)
  ]);

  return {
    companies: companies.map(shapeCompanySummary),
    pagination: {
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + companies.length < total
    }
  };
};

/**
 * List all users (admin/super-admin)
 */
const listAllUsers = async ({ status, search, limit = 50, offset = 0, sort, companyId } = {}) => {
  const safeLimit = clamp(parseNumber(limit, 50), 1, 100);
  const safeOffset = Math.max(parseNumber(offset, 0), 0);

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (companyId) {
    filter.companies = toObjectId(companyId);
  }

  if (search) {
    filter.$or = [
      { displayName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort(resolveSort(sort, { createdAt: -1 }))
      .skip(safeOffset)
      .limit(safeLimit)
      .lean(),
    User.countDocuments(filter)
  ]);

  const formattedUsers = users.map((user) => ({
    ...shapeUserSummary(user)
  }));

  return {
    users: formattedUsers,
    pagination: {
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + users.length < total
    }
  };
};

const getAdminUserOverview = async ({ userId, limit = 6 } = {}) => {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) {
    throw createError(400, 'Invalid userId');
  }

  const user = await User.findById(userObjectId).select('-password').lean();
  if (!user) {
    throw createError(404, 'User not found');
  }

  const cappedLimit = clamp(parseNumber(limit, 6), 3, 25);

  const [recentActivities, recentServices, campaignSummary, conversations, callLogs] = await Promise.all([
    Activity.find({ user: userObjectId })
      .sort({ createdAt: -1 })
      .limit(cappedLimit)
      .lean(),
    ServiceRequest.find({ createdBy: userObjectId, deletedAt: { $exists: false } })
      .sort({ updatedAt: -1 })
      .limit(cappedLimit)
      .select('serviceType title status priority assignedTo company createdAt updatedAt')
      .populate('assignedTo', 'displayName email role')
      .populate('company', 'displayName status')
      .lean(),
    UserPersonalizedOffer.aggregate([
      { $match: { user: userObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    ChatConversation.find({ 'participants.user': userObjectId })
      .sort({ updatedAt: -1 })
      .limit(cappedLimit)
      .lean(),
    CallLog.find({
      $or: [{ caller: userObjectId }, { callee: userObjectId }]
    })
      .sort({ startedAt: -1 })
      .limit(cappedLimit)
      .populate('caller', 'displayName email role')
      .populate('callee', 'displayName email role')
      .lean()
  ]);

  const campaignTotals = campaignSummary.reduce(
    (acc, row) => {
      acc.total += row.count;
      acc.byStatus[row._id || 'unknown'] = row.count;
      return acc;
    },
    { total: 0, byStatus: {} }
  );

  return {
    user: shapeUserSummary(user),
    activity: {
      recent: recentActivities.map((entry) => ({
        id: entry._id.toString(),
        action: entry.action,
        label: entry.label,
        description: entry.description,
        createdAt: entry.createdAt
      })),
      total: await Activity.countDocuments({ user: userObjectId })
    },
    services: {
      recent: recentServices.map((item) => ({
        id: item._id.toString(),
        serviceType: item.serviceType,
        title: item.title,
        status: item.status,
        priority: item.priority,
        assignedTo: item.assignedTo
          ? {
            id: item.assignedTo._id?.toString?.() || item.assignedTo,
            displayName: item.assignedTo.displayName,
            email: item.assignedTo.email,
            role: item.assignedTo.role
          }
          : null,
        company: item.company
          ? {
            id: item.company._id?.toString?.() || item.company,
            displayName: item.company.displayName,
            status: item.company.status
          }
          : null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      total: await ServiceRequest.countDocuments({ createdBy: userObjectId, deletedAt: { $exists: false } })
    },
    campaigns: campaignTotals,
    communications: {
      conversations: {
        total: conversations.length,
        recent: conversations.map((conversation) => ({
          id: conversation._id.toString(),
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          updatedAt: conversation.updatedAt
        }))
      },
      calls: {
        total: await CallLog.countDocuments({
          $or: [{ caller: userObjectId }, { callee: userObjectId }]
        }),
        recent: callLogs.map((log) => ({
          id: log._id.toString(),
          startedAt: log.startedAt,
          endedAt: log.endedAt,
          durationSeconds: log.durationSeconds,
          caller: log.caller
            ? {
              id: log.caller._id?.toString?.() || log.caller,
              displayName: log.caller.displayName,
              email: log.caller.email,
              role: log.caller.role
            }
            : null,
          callee: log.callee
            ? {
              id: log.callee._id?.toString?.() || log.callee,
              displayName: log.callee.displayName,
              email: log.callee.email,
              role: log.callee.role
            }
            : null
        }))
      }
    }
  };
};

const findCompanyOrThrow = async (companyId) => {
  const company = await Company.findById(companyId).populate('owner', 'displayName email');
  if (!company) {
    throw createError(404, 'Company not found');
  }
  return company;
};

const setCompanyStatus = async ({ companyId, actorId, status, reason }) => {
  const company = await findCompanyOrThrow(companyId);

  company.status = status;
  company.updatedBy = actorId;

  if (['archived', 'inactive', 'suspended'].includes(status)) {
    company.archivedAt = company.archivedAt || new Date();
    company.archivedBy = actorId;
    company.deactivatedReason = reason?.trim() || company.deactivatedReason;
  }

  if (status === 'active' || status === 'pending-verification') {
    company.archivedAt = undefined;
    company.archivedBy = undefined;
    company.deactivatedReason = undefined;
  }

  await company.save();

  return {
    success: true,
    message: `Company status updated to ${status}`,
    company: shapeCompanySummary(company)
  };
};

const archiveCompany = async ({ companyId, actorId, reason }) =>
  setCompanyStatus({ companyId, actorId, status: 'archived', reason });

const deleteCompany = async ({ companyId, actorId, reason }) => {
  const archived = await archiveCompany({ companyId, actorId, reason });
  return {
    ...archived,
    deprecated: true,
    message: 'Hard delete is deprecated on this endpoint. Company archived instead.'
  };
};

const cleanupCompanyDataHardDelete = async ({ companyId }) => {
  const companyObjectId = toObjectId(companyId);
  if (!companyObjectId) {
    throw createError(400, 'Invalid company id for hard delete');
  }

  await Promise.all([
    CompanyVerificationRequest.deleteMany({ company: companyObjectId }),
    Product.deleteMany({ company: companyObjectId }),
    ProductVariant.deleteMany({ company: companyObjectId }),
    ServiceRequest.deleteMany({ company: companyObjectId }),
    ProductQuote.deleteMany({ $or: [{ buyerCompany: companyObjectId }, { sellerCompany: companyObjectId }] }),
    Unit.deleteMany({ company: companyObjectId }),
    Account.deleteMany({ company: companyObjectId }),
    AccountingVoucherLog.deleteMany({ company: companyObjectId }),
    StockMove.deleteMany({ company: companyObjectId }),
    InventoryBalance.deleteMany({ company: companyObjectId }),
    LedgerPosting.deleteMany({ company: companyObjectId }),
    AccountingBill.deleteMany({ company: companyObjectId }),
    Party.deleteMany({ company: companyObjectId }),
    AccountingVoucher.deleteMany({ company: companyObjectId }),
    AccountingSequence.deleteMany({ company: companyObjectId }),
    UserPersonalizedOffer.deleteMany({ company: companyObjectId }),
    Notification.deleteMany({ company: companyObjectId }),
    Activity.updateMany(
      { company: companyObjectId },
      { $unset: { company: '' }, $set: { companyName: '[hard-deleted]' } }
    ),
    User.updateMany(
      { activeCompany: companyObjectId },
      { $set: { activeCompany: null } }
    ),
    User.updateMany(
      { companies: companyObjectId },
      { $pull: { companies: companyObjectId } }
    )
  ]);

  await Company.findByIdAndDelete(companyObjectId);
};

const hardDeleteCompany = async ({ companyId, actorId, reason }) => {
  const company = await findCompanyOrThrow(companyId);
  const companyObjectId = company._id.toString();
  const jobId = new mongoose.Types.ObjectId().toString();

  HARD_DELETE_JOB_STORE.set(jobId, {
    id: jobId,
    companyId: companyObjectId,
    actorId,
    reason,
    status: 'queued',
    queuedAt: new Date().toISOString()
  });

  setImmediate(async () => {
    try {
      HARD_DELETE_JOB_STORE.set(jobId, {
        ...HARD_DELETE_JOB_STORE.get(jobId),
        status: 'running',
        startedAt: new Date().toISOString()
      });

      await cleanupCompanyDataHardDelete({ companyId: companyObjectId });

      HARD_DELETE_JOB_STORE.set(jobId, {
        ...HARD_DELETE_JOB_STORE.get(jobId),
        status: 'completed',
        finishedAt: new Date().toISOString()
      });
    } catch (error) {
      HARD_DELETE_JOB_STORE.set(jobId, {
        ...HARD_DELETE_JOB_STORE.get(jobId),
        status: 'failed',
        error: error.message,
        finishedAt: new Date().toISOString()
      });
    }
  });

  return {
    success: true,
    message: `Hard delete job queued for company "${company.displayName}"`,
    job: HARD_DELETE_JOB_STORE.get(jobId)
  };
};

const listAdminAuditEvents = async ({ userId, companyId, action, from, to, limit = 50, offset = 0 } = {}) => {
  const safeLimit = clamp(parseNumber(limit, 50), 1, 100);
  const safeOffset = Math.max(parseNumber(offset, 0), 0);

  const query = {
    $or: [{ category: 'admin' }, { action: /^admin\./ }]
  };

  if (userId) {
    query.user = toObjectId(userId);
  }
  if (companyId) {
    query.company = toObjectId(companyId);
  }
  if (action) {
    query.action = action;
  }
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  const [events, total] = await Promise.all([
    Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(safeOffset)
      .limit(safeLimit)
      .populate('user', 'displayName email role')
      .populate('company', 'displayName status')
      .lean(),
    Activity.countDocuments(query)
  ]);

  return {
    events: events.map((event) => ({
      id: event._id.toString(),
      action: event.action,
      category: event.category,
      label: event.label,
      description: event.description,
      actor: event.user
        ? {
          id: event.user._id?.toString?.() || event.user,
          displayName: event.user.displayName,
          email: event.user.email,
          role: event.user.role
        }
        : null,
      company: event.company
        ? {
          id: event.company._id?.toString?.() || event.company,
          displayName: event.company.displayName,
          status: event.company.status
        }
        : null,
      companyName: event.companyName,
      meta: event.meta instanceof Map ? Object.fromEntries(event.meta) : event.meta || {},
      ip: event.ip,
      userAgent: event.userAgent,
      createdAt: event.createdAt
    })),
    pagination: {
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + events.length < total
    }
  };
};

/**
 * Request documents from a company for verification (admin only)
 */
const requestDocuments = async (
  companyId,
  adminId,
  { message, sendEmail = true, sendNotification = true } = {}
) => {
  const company = await findCompanyOrThrow(companyId);

  if (company.status !== 'pending-verification') {
    throw createError(400, 'Company is not in pending verification status');
  }

  if (!company.owner) {
    throw createError(400, 'Company does not have an owner assigned');
  }

  const owner = company.owner;
  const results = {
    success: true,
    message: 'Document request sent successfully',
    emailSent: false,
    notificationSent: false
  };

  if (sendEmail && owner.email) {
    const emailResult = await sendDocumentRequestEmail({
      ownerEmail: owner.email,
      ownerName: owner.displayName || 'User',
      companyName: company.displayName,
      customMessage: message
    });
    results.emailSent = emailResult.success;
    if (!emailResult.success) {
      console.warn(`[AdminService] Failed to send email to ${owner.email}:`, emailResult.error);
    }
  }

  if (sendNotification) {
    const notificationResult = await createDocumentRequestNotification({
      userId: owner._id.toString(),
      companyId: company._id.toString(),
      companyName: company.displayName,
      actorId: adminId,
      customMessage: message
    });
    results.notificationSent = notificationResult.success;
    if (!notificationResult.success) {
      console.warn(`[AdminService] Failed to create notification:`, notificationResult.error);
    }
  }

  if (!results.emailSent && !results.notificationSent) {
    throw createError(500, 'Failed to send both email and notification');
  }

  company.documentsRequestedAt = new Date();
  company.updatedBy = adminId;
  await company.save();

  return results;
};

module.exports = {
  getAdminStats,
  getAdminOverview,
  listAllCompanies,
  listAllUsers,
  getAdminUserOverview,
  setCompanyStatus,
  archiveCompany,
  deleteCompany,
  hardDeleteCompany,
  listAdminAuditEvents,
  requestDocuments
};
