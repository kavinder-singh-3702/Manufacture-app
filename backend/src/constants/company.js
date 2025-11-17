const COMPANY_STATUS = Object.freeze([
  'pending-verification',
  'active',
  'inactive',
  'suspended',
  'archived'
]);

const COMPANY_SIZE_BUCKETS = Object.freeze(['1-10', '11-50', '51-200', '201-500', '500+']);

module.exports = {
  COMPANY_STATUS,
  COMPANY_SIZE_BUCKETS
};
