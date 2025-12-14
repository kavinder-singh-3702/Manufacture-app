const BUSINESS_ACCOUNT_TYPES = Object.freeze(['normal', 'trader', 'manufacturer']);
const COMPANY_VERIFICATION_ACCOUNT_TYPES = Object.freeze(['trader', 'manufacturer']);

const BUSINESS_CATEGORIES = Object.freeze([
  'printing',
  'manufacturing',
  'packaging',
  'logistics',
  'textiles',
  'machinery',
  'other'
]);

// Inventory categories for product/material classification
const INVENTORY_CATEGORIES = Object.freeze([
  { id: 'raw-materials', title: 'Raw Materials' },
  { id: 'packaging', title: 'Packaging & Supplies' },
  { id: 'machinery', title: 'Machinery Parts' },
  { id: 'safety', title: 'Safety Equipment' },
  { id: 'chemicals', title: 'Chemicals & Solvents' },
  { id: 'tools', title: 'Tools & Hardware' }
]);

module.exports = {
  BUSINESS_ACCOUNT_TYPES,
  BUSINESS_CATEGORIES,
  COMPANY_VERIFICATION_ACCOUNT_TYPES,
  INVENTORY_CATEGORIES
};
