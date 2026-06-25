const {
  createContactMessage,
  listContactMessages,
  updateContactMessageStatus,
} = require('../services/contact.service');
const {
  ADMIN_PERMISSIONS,
  assertAdminPermission,
} = require('../../admin/permissions');

const createContactMessageController = async (req, res, next) => {
  try {
    const message = await createContactMessage(req.body, {
      user: req.user,
      meta: {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    });
    return res.status(201).json({
      ok: true,
      message: 'Thanks for reaching out — we\'ll get back to you shortly.',
      contactMessageId: message._id,
    });
  } catch (error) {
    return next(error);
  }
};

const listContactMessagesController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_CONTACT_MESSAGES);
    const result = await listContactMessages(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const updateContactMessageStatusController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_CONTACT_MESSAGES);
    const message = await updateContactMessageStatus(req.params.messageId, req.body);
    if (!message) return res.status(404).json({ error: 'Contact message not found' });
    return res.json({ message });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createContactMessageController,
  listContactMessagesController,
  updateContactMessageStatusController,
};
