const {
  createInquiry,
  listUserInquiries,
  listAdminInquiries,
  getAdminInquiry,
  updateInquiryStatus,
} = require('../services/productInquiry.service');
const {
  ADMIN_PERMISSIONS,
  assertAdminPermission,
} = require('../../admin/permissions');

const createInquiryController = async (req, res, next) => {
  try {
    const inquiry = await createInquiry(req.body, req.user);
    return res.status(201).json({ inquiry });
  } catch (error) {
    return next(error);
  }
};

const listUserInquiriesController = async (req, res, next) => {
  try {
    const result = await listUserInquiries(req.user.id, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const listAdminInquiriesController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_PRODUCT_INQUIRIES);
    const result = await listAdminInquiries(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getAdminInquiryController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_PRODUCT_INQUIRIES);
    const inquiry = await getAdminInquiry(req.params.inquiryId);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    return res.json({ inquiry });
  } catch (error) {
    return next(error);
  }
};

const updateAdminInquiryStatusController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_PRODUCT_INQUIRIES);
    const inquiry = await updateInquiryStatus(req.params.inquiryId, req.body);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    return res.json({ inquiry });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createInquiryController,
  listUserInquiriesController,
  listAdminInquiriesController,
  getAdminInquiryController,
  updateAdminInquiryStatusController,
};
