const QUOTE_STATUSES = Object.freeze([
  'pending',
  'quoted',
  'accepted',
  'rejected',
  'cancelled',
  'expired'
]);

const QUOTE_MODES = Object.freeze(['asked', 'received', 'incoming']);

const BUYER_ACTION_STATUSES = Object.freeze(['accepted', 'rejected', 'cancelled']);

const SELLER_ADMIN_ACTION_STATUSES = Object.freeze(['expired']);

module.exports = {
  QUOTE_STATUSES,
  QUOTE_MODES,
  BUYER_ACTION_STATUSES,
  SELLER_ADMIN_ACTION_STATUSES
};
