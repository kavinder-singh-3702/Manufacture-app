const express = require('express');
const {
  getVerificationStatus,
  submitVerification,
  uploadDocument,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getVerificationStats,
} = require('../controllers/verification.controller');

const router = express.Router();

// Middleware - You'll need to import your auth middleware
// const { protect, restrictTo } = require('../middleware/authMiddleware');

// User routes (require authentication)
// Replace 'protect' with your actual auth middleware
router.get('/status', getVerificationStatus); // Get own verification status
router.post('/submit', submitVerification); // Submit verification request
router.post('/upload', uploadDocument); // Upload verification documents

// Admin routes (require admin role)
// Replace 'restrictTo('admin')' with your actual admin middleware
router.get('/admin/pending', getPendingVerifications); // Get all pending requests
router.get('/admin/stats', getVerificationStats); // Get verification statistics
router.post('/admin/approve/:userId', approveVerification); // Approve user verification
router.post('/admin/reject/:userId', rejectVerification); // Reject user verification

module.exports = router;
