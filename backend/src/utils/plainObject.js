// Coerces Mongoose Maps/documents/plain objects into a plain JS object.
// Previously copy-pasted across notification.service.js,
// notificationDispatcher.service.js, and notificationDeliveryPolicy.service.js
// — consolidated here so the coercion rules can't drift between call sites.
const toPlainObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value.toObject === 'function') return value.toObject();
  if (typeof value === 'object') return value;
  return {};
};

module.exports = { toPlainObject };
