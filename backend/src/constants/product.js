const PRODUCT_STATUSES = Object.freeze(['draft', 'active', 'inactive', 'archived']);
const PRODUCT_VISIBILITY = Object.freeze(['public', 'private']);
const PRODUCT_CATEGORIES = Object.freeze([
  { id: 'finished-goods', label: 'Finished Goods' },
  { id: 'components', label: 'Components & Parts' },
  { id: 'raw-materials', label: 'Raw Materials' },
  { id: 'machinery', label: 'Machinery & Equipment' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'services', label: 'Services' },
  { id: 'other', label: 'Other' }
]);
const DISCOUNT_TYPES = Object.freeze(['percentage', 'flat']);
const DEFAULT_CURRENCY = 'INR';

module.exports = {
  PRODUCT_STATUSES,
  PRODUCT_VISIBILITY,
  PRODUCT_CATEGORIES,
  DISCOUNT_TYPES,
  DEFAULT_CURRENCY
};
