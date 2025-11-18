const User = require('../models/user.model');
const createError = require('http-errors');

/**
 * Get current user's verification status
 * GET /api/verification/status
 */
const getVerificationStatus = async (req, res, next) => {
  try {
    const userId = req.user._id; 

    const user = await User.findById(userId).select('verificationStatus verificationData');

    if (!user) {
      throw createError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: {
        status: user.verificationStatus,
        submittedAt: user.verificationData?.submittedAt,
        reviewedAt: user.verificationData?.reviewedAt,
        rejectionReason: user.verificationData?.rejectionReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit verification request
 * POST /api/verification/submit
 */
const submitVerification = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { gstNumber, accountNumber, ifscCode, accountHolderName } = req.body;

    // Validate required fields
    if (!gstNumber || !accountNumber || !ifscCode || !accountHolderName) {
      throw createError(400, 'All verification fields are required');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw createError(404, 'User not found');
    }

    // Check if already verified
    if (user.verificationStatus === 'verified') {
      throw createError(400, 'User is already verified');
    }

    // Check if pending
    if (user.verificationStatus === 'pending') {
      throw createError(400, 'Verification request is already pending');
    }

    // Update user with verification data
    user.verificationStatus = 'pending';
    user.verificationData = {
      gstNumber,
      accountNumber,
      ifscCode,
      accountHolderName,
      submittedAt: new Date(),
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Verification request submitted successfully',
      data: {
        status: user.verificationStatus,
        submittedAt: user.verificationData.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload verification document (GST or Bank proof)
 * POST /api/verification/upload
 */
const uploadDocument = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { documentType, documentUrl } = req.body;

    if (!documentType || !documentUrl) {
      throw createError(400, 'Document type and URL are required');
    }

    if (!['gst', 'bank'].includes(documentType)) {
      throw createError(400, 'Invalid document type. Must be "gst" or "bank"');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw createError(404, 'User not found');
    }

    // Initialize verificationData if it doesn't exist
    if (!user.verificationData) {
      user.verificationData = {};
    }

    // Update document URL
    if (documentType === 'gst') {
      user.verificationData.gstDocumentUrl = documentUrl;
    } else {
      user.verificationData.bankProofUrl = documentUrl;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        documentType,
        documentUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending verification requests (Admin only)
 * GET /api/verification/admin/pending
 */
const getPendingVerifications = async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ verificationStatus: 'pending' })
      .select('firstName lastName email displayName verificationStatus verificationData avatarUrl')
      .sort({ 'verificationData.submittedAt': -1 });

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve verification request (Admin only)
 * POST /api/verification/admin/approve/:userId
 */
const approveVerification = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const adminId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      throw createError(404, 'User not found');
    }

    if (user.verificationStatus !== 'pending') {
      throw createError(400, 'Only pending verifications can be approved');
    }

    user.verificationStatus = 'verified';
    user.verificationData.reviewedAt = new Date();
    user.verificationData.reviewedBy = adminId;
    user.verificationData.rejectionReason = undefined; 

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Verification approved successfully',
      data: {
        userId: user._id,
        status: user.verificationStatus,
        reviewedAt: user.verificationData.reviewedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject verification request (Admin only)
 * POST /api/verification/admin/reject/:userId
 */
const rejectVerification = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    if (!reason || reason.trim() === '') {
      throw createError(400, 'Rejection reason is required');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw createError(404, 'User not found');
    }

    if (user.verificationStatus !== 'pending') {
      throw createError(400, 'Only pending verifications can be rejected');
    }

    user.verificationStatus = 'rejected';
    user.verificationData.reviewedAt = new Date();
    user.verificationData.reviewedBy = adminId;
    user.verificationData.rejectionReason = reason;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Verification rejected',
      data: {
        userId: user._id,
        status: user.verificationStatus,
        reviewedAt: user.verificationData.reviewedAt,
        rejectionReason: user.verificationData.rejectionReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get verification statistics (Admin only)
 * GET /api/verification/admin/stats
 */
const getVerificationStats = async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      unverified: 0,
      pending: 0,
      verified: 0,
      rejected: 0,
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVerificationStatus,
  submitVerification,
  uploadDocument,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getVerificationStats,
};
