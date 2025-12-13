const User = require('../../../models/user.model');
const Company = require('../../../models/company.model');
const CompanyVerificationRequest = require('../../../models/companyVerificationRequest.model');
const { sendDocumentRequestEmail } = require('../../../services/email.service');
const { createDocumentRequestNotification } = require('../../../services/notification.service');

/**
 * Get admin dashboard statistics
 * Returns counts for users, companies, and verification requests
 */
const getAdminStats = async () => {
  // Run all queries in parallel for better performance
  const [
    totalUsers,
    activeUsers,
    totalCompanies,
    activeCompanies,
    pendingVerifications,
    approvedVerifications,
    rejectedVerifications
  ] = await Promise.all([
    // Total users count
    User.countDocuments({}),

    // Active users count (status = 'active')
    User.countDocuments({ status: 'active' }),

    // Total companies count
    Company.countDocuments({}),

    // Active companies count (status = 'active')
    Company.countDocuments({ status: 'active' }),

    // Pending verification requests count
    CompanyVerificationRequest.countDocuments({ status: 'pending' }),

    // Approved verification requests count
    CompanyVerificationRequest.countDocuments({ status: 'approved' }),

    // Rejected verification requests count
    CompanyVerificationRequest.countDocuments({ status: 'rejected' })
  ]);

  // Calculate today's activity (verifications submitted/decided today)
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

/**
 * List all companies (admin only)
 * Returns all companies with owner info, sorted by creation date
 */
const listAllCompanies = async ({ status, search, limit = 50, offset = 0 } = {}) => {
  // Build query filter
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    // Search by company name (case-insensitive)
    filter.displayName = { $regex: search, $options: 'i' };
  }

  // Fetch companies with owner info
  const companies = await Company.find(filter)
    .populate('owner', 'displayName email')
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  // Get total count for pagination
  const total = await Company.countDocuments(filter);

  // Transform to response format
  const formattedCompanies = companies.map(company => ({
    id: company._id.toString(),
    displayName: company.displayName,
    legalName: company.legalName,
    type: company.type,
    status: company.status || 'pending-verification',
    complianceStatus: company.complianceStatus,
    categories: company.categories || [],
    logoUrl: company.logoUrl,
    owner: company.owner ? {
      id: company.owner._id?.toString(),
      displayName: company.owner.displayName,
      email: company.owner.email
    } : null,
    documentsRequestedAt: company.documentsRequestedAt,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt
  }));

  return {
    companies: formattedCompanies,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + companies.length < total
    }
  };
};

/**
 * List all users (admin only)
 * Returns all users, sorted by creation date
 */
const listAllUsers = async ({ status, search, limit = 50, offset = 0 } = {}) => {
  // Build query filter
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    // Search by name or email (case-insensitive)
    filter.$or = [
      { displayName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Fetch users
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  // Get total count for pagination
  const total = await User.countDocuments(filter);

  // Transform to response format
  const formattedUsers = users.map(user => ({
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role || 'user',
    status: user.status || 'active',
    accountType: user.accountType,
    verificationStatus: user.verificationStatus,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt
  }));

  return {
    users: formattedUsers,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + users.length < total
    }
  };
};

/**
 * Delete a company (admin only)
 * Removes the company and its associated verification requests
 */
const deleteCompany = async (companyId) => {
  // Find the company first to ensure it exists
  const company = await Company.findById(companyId);

  if (!company) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete associated verification requests
  await CompanyVerificationRequest.deleteMany({ company: companyId });

  // Delete the company
  await Company.findByIdAndDelete(companyId);

  return {
    success: true,
    message: `Company "${company.displayName}" has been deleted`,
    deletedCompanyId: companyId
  };
};

/**
 * Request documents from a company for verification (admin only)
 * Sends email and/or notification to the company owner
 * @param {string} companyId - Company ID to request documents from
 * @param {string} adminId - Admin user ID making the request
 * @param {Object} options - Request options
 * @param {string} options.message - Optional custom message
 * @param {boolean} options.sendEmail - Whether to send email (default: true)
 * @param {boolean} options.sendNotification - Whether to send notification (default: true)
 */
const requestDocuments = async (companyId, adminId, { message, sendEmail = true, sendNotification = true } = {}) => {
  // Find the company with owner details
  const company = await Company.findById(companyId).populate('owner', 'displayName email');

  if (!company) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if company is in pending status
  if (company.status !== 'pending-verification') {
    const error = new Error('Company is not in pending verification status');
    error.statusCode = 400;
    throw error;
  }

  // Check if company has an owner
  if (!company.owner) {
    const error = new Error('Company does not have an owner assigned');
    error.statusCode = 400;
    throw error;
  }

  const owner = company.owner;
  const results = {
    success: true,
    message: 'Document request sent successfully',
    emailSent: false,
    notificationSent: false
  };

  // Send email if requested
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

  // Send in-app notification if requested
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

  // Check if at least one method succeeded
  if (!results.emailSent && !results.notificationSent) {
    const error = new Error('Failed to send both email and notification');
    error.statusCode = 500;
    throw error;
  }

  // Update company to mark documents as requested
  await Company.findByIdAndUpdate(companyId, {
    documentsRequestedAt: new Date()
  });

  return results;
};

module.exports = {
  getAdminStats,
  listAllCompanies,
  listAllUsers,
  deleteCompany,
  requestDocuments
};
