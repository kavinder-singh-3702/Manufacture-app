const PRODUCT_VARIANT_STATUSES = Object.freeze(['active', 'inactive', 'archived']);

const PRODUCT_VARIANT_LOG_ACTIONS = Object.freeze([
  'variant.created',
  'variant.updated',
  'variant.quantity_adjusted',
  'variant.deleted'
]);

module.exports = {
  PRODUCT_VARIANT_STATUSES,
  PRODUCT_VARIANT_LOG_ACTIONS
};

