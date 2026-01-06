const BUSINESS_ACCOUNT_TYPES = Object.freeze(['normal', 'trader', 'manufacturer']);
const COMPANY_VERIFICATION_ACCOUNT_TYPES = Object.freeze(['trader', 'manufacturer']);

const MODERN_MANUFACTURING_CATEGORIES = [
  'food & beverage manufacturing',
  'textile & apparel manufacturing',
  'paper & packaging industry',
  'chemical manufacturing',
  'pharmaceutical & medical manufacturing',
  'plastic & polymer industry',
  'rubber industry',
  'metal & steel industry',
  'automobile & auto components',
  'electrical & electronics manufacturing',
  'machinery & heavy engineering',
  'wood & furniture industry',
  'construction material industry',
  'leather industry',
  'petroleum & energy-based manufacturing',
  'defence & aerospace manufacturing',
  'consumer goods (fmcg) manufacturing',
  'printing & publishing',
  'toys & sports goods manufacturing',
  'handicrafts & cottage industries'
];

const LEGACY_BUSINESS_CATEGORIES = ['printing', 'manufacturing', 'packaging', 'logistics', 'textiles', 'machinery', 'other'];

const BUSINESS_CATEGORIES = Object.freeze([
  ...new Set([
    ...MODERN_MANUFACTURING_CATEGORIES.map((label) => label.toLowerCase()),
    ...MODERN_MANUFACTURING_CATEGORIES.map((label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    ...LEGACY_BUSINESS_CATEGORIES
  ])
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
