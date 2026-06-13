const mongoose = require('mongoose');
const createError = require('http-errors');
const ContactMessage = require('../../../models/contactMessage.model');
const { CONTACT_MESSAGE_STATUSES } = require('../../../constants/contact');
const { sendContactMessageEmail } = require('../../../services/email.service');

const toObjectId = (value, fieldLabel = 'id') => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!mongoose.Types.ObjectId.isValid(value)) throw createError(400, `Invalid ${fieldLabel}`);
  return new mongoose.Types.ObjectId(value);
};

const trimOrUndefined = (value, max) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return max ? trimmed.slice(0, max) : trimmed;
};

const createContactMessage = async (payload, { user, meta } = {}) => {
  const name = trimOrUndefined(payload.name, 120);
  const email = trimOrUndefined(payload.email, 200)?.toLowerCase();
  const message = trimOrUndefined(payload.message, 4000);

  if (!name || !email || !message) {
    throw createError(400, 'name, email, and message are required');
  }

  const doc = await ContactMessage.create({
    name,
    email,
    company: trimOrUndefined(payload.company, 200),
    topic: trimOrUndefined(payload.topic, 120),
    message,
    user: user?.id ? toObjectId(user.id, 'user') : undefined,
    meta: {
      ip: trimOrUndefined(meta?.ip, 64),
      userAgent: trimOrUndefined(meta?.userAgent, 400),
    },
  });

  // Notify support — best-effort. A failed email must not fail the submission.
  try {
    await sendContactMessageEmail({
      name,
      email,
      company: doc.company,
      topic: doc.topic,
      message,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[ContactService] Failed to send notification email:', error?.message || error);
  }

  return doc.toObject();
};

const listContactMessages = async (filters = {}) => {
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  const query = {};
  if (filters.status && CONTACT_MESSAGE_STATUSES.includes(filters.status)) {
    query.status = filters.status;
  }

  const [messages, total] = await Promise.all([
    ContactMessage.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    ContactMessage.countDocuments(query),
  ]);

  return { messages, pagination: { total, limit, offset, hasMore: offset + limit < total } };
};

const updateContactMessageStatus = async (messageId, payload) => {
  const id = toObjectId(messageId, 'messageId');
  if (!CONTACT_MESSAGE_STATUSES.includes(payload.status)) {
    throw createError(400, 'Invalid contact message status');
  }

  const doc = await ContactMessage.findById(id);
  if (!doc) return null;

  doc.status = payload.status;
  if (typeof payload.adminNotes === 'string') {
    doc.adminNotes = payload.adminNotes.trim() || undefined;
  }
  await doc.save();

  return doc.toObject();
};

module.exports = {
  createContactMessage,
  listContactMessages,
  updateContactMessageStatus,
};
