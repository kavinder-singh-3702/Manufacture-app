// Single source of truth for stock status. Mirrors the Product schema's
// `stockStatus` virtual (models/product.model.js) — that virtual only survives
// on hydrated Mongoose docs, but every read path here uses `.lean()`, so it
// never actually reaches API responses. This plain-JS version is what gets
// attached after `.lean()` instead.
const computeStockStatus = ({ availableQuantity, minStockQuantity }) => {
  if (availableQuantity <= 0) return 'out_of_stock';
  if (availableQuantity <= minStockQuantity) return 'low_stock';
  return 'in_stock';
};

module.exports = { computeStockStatus };
