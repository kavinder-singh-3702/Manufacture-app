const { BUSINESS_CATEGORIES } = require('../../../constants/business');

const CATEGORY_SET = new Set(BUSINESS_CATEGORIES);

const normalizeCategories = (categories = []) => {
  const list = Array.isArray(categories) ? categories : [];
  const normalized = list
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter(Boolean);
  const unique = [...new Set(normalized)];
  return unique.filter((category) => CATEGORY_SET.has(category));
};

const buildCompanyResponse = (company) => {
  if (!company) return null;
  if (typeof company.toObject === 'function') {
    const { __v, ...rest } = company.toObject({ versionKey: false });
    return rest;
  }
  const { __v, ...rest } = company;
  return rest;
};

module.exports = {
  normalizeCategories,
  buildCompanyResponse
};
