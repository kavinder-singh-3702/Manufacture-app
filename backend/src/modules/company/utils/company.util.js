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
  const normalize = (value) => {
    if (!value) return null;
    const plain = typeof value.toObject === 'function' ? value.toObject({ versionKey: false }) : value;
    if (!plain) return null;
    const { __v, _id, ...rest } = plain;
    return { ...rest, id: plain.id || (_id ? _id.toString() : undefined) };
  };
  return normalize(company);
};

module.exports = {
  normalizeCategories,
  buildCompanyResponse
};
