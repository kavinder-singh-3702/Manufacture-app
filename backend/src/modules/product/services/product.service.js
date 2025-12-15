const mongoose = require('mongoose');
const Product = require('../../../models/product.model');
const { uploadProductImage } = require('../../../services/storage.service');
const { PRODUCT_CATEGORIES } = require('../../../constants/product');

const buildStockStatusExpr = (status) => {
  if (status === 'out_of_stock') {
    return { $lte: ['$availableQuantity', 0] };
  }
  if (status === 'low_stock') {
    return { $and: [{ $gt: ['$availableQuantity', 0] }, { $lte: ['$availableQuantity', '$minStockQuantity'] }] };
  }
  if (status === 'in_stock') {
    return { $gt: ['$availableQuantity', '$minStockQuantity'] };
  }
  return null;
};

const getCategoryStats = async (companyId) => {
  const matchQuery = { deletedAt: { $exists: false } };
  if (companyId) {
    matchQuery.company = new mongoose.Types.ObjectId(companyId);
  }

  const countsByCategory = await Product.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$availableQuantity' }
      }
    }
  ]);

  const countsMap = {};
  countsByCategory.forEach((item) => {
    countsMap[item._id] = { count: item.count, totalQuantity: item.totalQuantity };
  });

  const categories = PRODUCT_CATEGORIES.map((category) => ({
    id: category.id,
    title: category.label,
    count: countsMap[category.id]?.count || 0,
    totalQuantity: countsMap[category.id]?.totalQuantity || 0
  }));

  return { categories };
};

const getProductsByCategory = async (companyId, categoryId, { limit = 20, offset = 0 } = {}) => {
  const query = { category: categoryId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = new mongoose.Types.ObjectId(companyId);
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Product.countDocuments(query)
  ]);

  return {
    products,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + products.length < total
    }
  };
};

const getAllProducts = async (
  companyId,
  { limit = 20, offset = 0, category, status, search, visibility } = {}
) => {
  const query = { deletedAt: { $exists: false } };

  if (companyId) {
    query.company = new mongoose.Types.ObjectId(companyId);
  }
  if (category) {
    query.category = category;
  }
  if (visibility) {
    query.visibility = visibility;
  }
  if (status) {
    const expr = buildStockStatusExpr(status);
    if (expr) {
      query.$expr = expr;
    } else {
      query.status = status;
    }
  }
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ name: regex }, { description: regex }, { sku: regex }];
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Product.countDocuments(query)
  ]);

  return {
    products,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + products.length < total
    }
  };
};

const getProductById = async (productId, companyId) => {
  const query = { _id: productId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = companyId;
  }
  return Product.findOne(query).lean();
};

const createProduct = async (payload, userId, companyId) => {
  const product = new Product({
    ...payload,
    company: companyId,
    createdBy: userId,
    lastUpdatedBy: userId
  });

  await product.save();
  return product.toObject();
};

const updateProduct = async (productId, updates, userId, companyId) => {
  const query = { _id: productId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = companyId;
  }

  const product = await Product.findOneAndUpdate(
    query,
    { ...updates, lastUpdatedBy: userId, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  return product?.toObject() || null;
};

const adjustQuantity = async (productId, adjustment, userId, companyId) => {
  const query = { _id: productId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = companyId;
  }

  const product = await Product.findOne(query);
  if (!product) return null;

  product.availableQuantity = Math.max(0, product.availableQuantity + adjustment);
  product.lastUpdatedBy = userId;
  await product.save();

  return product.toObject();
};

const deleteProduct = async (productId, companyId) => {
  const query = { _id: productId };
  if (companyId) {
    query.company = companyId;
  }

  const result = await Product.findOneAndUpdate(query, { deletedAt: new Date() }, { new: true });
  return !!result;
};

const applyTargetedDiscount = async (productId, companyId, discountPayload, actorUserId) => {
  const query = { _id: productId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = companyId;
  }

  const product = await Product.findOne(query);
  if (!product) return null;

  const normalized = {
    user: discountPayload.userId,
    type: discountPayload.type,
    value: discountPayload.value,
    reason: discountPayload.reason,
    expiresAt: discountPayload.expiresAt,
    createdBy: actorUserId,
    createdAt: new Date()
  };

  const existingIndex = product.targetedDiscounts.findIndex(
    (entry) => entry.user?.toString() === String(discountPayload.userId)
  );

  if (existingIndex >= 0) {
    product.targetedDiscounts[existingIndex] = normalized;
  } else {
    product.targetedDiscounts.push(normalized);
  }

  product.lastUpdatedBy = actorUserId;
  await product.save();

  return product.toObject();
};

const addProductImage = async (productId, companyId, filePayload, userId) => {
  const query = { _id: productId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = companyId;
  }

  const product = await Product.findOne(query);
  if (!product) return null;

  const upload = await uploadProductImage({
    productId,
    companyId,
    userId,
    fileName: filePayload.fileName,
    mimeType: filePayload.mimeType,
    base64: filePayload.content
  });

  product.images.push({
    key: upload.key,
    url: upload.url,
    fileName: upload.fileName,
    contentType: upload.contentType,
    uploadedAt: upload.uploadedAt,
    uploadedBy: userId
  });
  product.lastUpdatedBy = userId;

  await product.save();

  const image = product.images[product.images.length - 1];

  return {
    product: product.toObject(),
    image
  };
};

const getProductStats = async (companyId) => {
  const matchQuery = { deletedAt: { $exists: false } };
  if (companyId) {
    matchQuery.company = new mongoose.Types.ObjectId(companyId);
  }

  const [categoryStats, valueStats, products] = await Promise.all([
    Product.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 }, totalQty: { $sum: '$availableQuantity' } } }
    ]),
    Product.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$availableQuantity', '$price.amount'] } },
          totalQuantity: { $sum: '$availableQuantity' }
        }
      }
    ]),
    Product.find(matchQuery).select('availableQuantity minStockQuantity').lean()
  ]);

  const categoryDistribution = PRODUCT_CATEGORIES.map((cat) => {
    const stats = categoryStats.find((s) => s._id === cat.id);
    return {
      id: cat.id,
      label: cat.label,
      count: stats?.count || 0,
      totalQuantity: stats?.totalQty || 0
    };
  });

  const statusBreakdown = { in_stock: 0, low_stock: 0, out_of_stock: 0 };
  products.forEach((product) => {
    if (product.availableQuantity <= 0) {
      statusBreakdown.out_of_stock += 1;
    } else if (product.availableQuantity <= product.minStockQuantity) {
      statusBreakdown.low_stock += 1;
    } else {
      statusBreakdown.in_stock += 1;
    }
  });

  const totals = valueStats[0] || { totalValue: 0, totalQuantity: 0 };

  return {
    totalItems: products.length,
    totalQuantity: totals.totalQuantity,
    totalCostValue: totals.totalValue,
    totalSellingValue: totals.totalValue,
    categoryDistribution,
    statusBreakdown,
    lowStockCount: statusBreakdown.low_stock,
    outOfStockCount: statusBreakdown.out_of_stock
  };
};

module.exports = {
  getCategoryStats,
  getProductsByCategory,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustQuantity,
  deleteProduct,
  applyTargetedDiscount,
  addProductImage,
  getProductStats
};
