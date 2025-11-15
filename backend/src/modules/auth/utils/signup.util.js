const splitFullName = (fullName) => {
  const [first = '', ...rest] = fullName.trim().split(/\s+/);
  return {
    firstName: first,
    lastName: rest.join(' ') || undefined
  };
};

const sanitizeCategories = (categories = [], allowedSet) => {
  const list = Array.isArray(categories) ? categories : [];
  const normalized = list
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter(Boolean);
  const unique = [...new Set(normalized)];
  return unique.filter((category) => allowedSet.has(category));
};

module.exports = {
  splitFullName,
  sanitizeCategories
};
