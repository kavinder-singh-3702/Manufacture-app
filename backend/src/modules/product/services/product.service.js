const mongoose = require('mongoose');
const Product = require('../../../models/product.model');
const User = require('../../../models/user.model');
const UserFavorite = require('../../../models/userFavorite.model');
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

const buildAdminCreatorFilter = async (createdByRole) => {
  if (createdByRole !== 'admin') return null;
  const adminIds = await User.find({ role: 'admin' }).distinct('_id');
  return {
    $or: [
      { createdByRole: 'admin' },
      { createdBy: { $in: adminIds } }
    ]
  };
};

const getCategoryStats = async (companyId, { createdByRole } = {}) => {
  const matchQuery = { deletedAt: { $exists: false } };
  if (companyId) {
    matchQuery.company = new mongoose.Types.ObjectId(companyId);
  }
  if (createdByRole) {
    const adminFilter = await buildAdminCreatorFilter(createdByRole);
    if (adminFilter) {
      matchQuery.$or = adminFilter.$or;
    } else {
      matchQuery.createdByRole = createdByRole;
    }
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

const getProductsByCategory = async (
  companyId,
  categoryId,
  { limit = 20, offset = 0, status, userId, minPrice, maxPrice, sort, excludeUserId, createdByRole } = {}
) => {
  const query = { category: categoryId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = new mongoose.Types.ObjectId(companyId);
  }
  if (excludeUserId) {
    query.createdBy = { $ne: new mongoose.Types.ObjectId(excludeUserId) };
  }
  if (createdByRole) {
    const adminFilter = await buildAdminCreatorFilter(createdByRole);
    if (adminFilter) {
      query.$or = adminFilter.$or;
    } else {
      query.createdByRole = createdByRole;
    }
  }
  if (status) {
    const expr = buildStockStatusExpr(status);
    if (expr) {
      query.$expr = expr;
    } else {
      query.status = status;
    }
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    query['price.amount'] = {};
    if (minPrice !== undefined) query['price.amount'].$gte = minPrice;
    if (maxPrice !== undefined) query['price.amount'].$lte = maxPrice;
    // Clean empty operator object
    if (Object.keys(query['price.amount']).length === 0) {
      delete query['price.amount'];
    }
  }

  const sortOptions = (() => {
    if (sort === 'priceAsc') return { 'price.amount': 1 };
    if (sort === 'priceDesc') return { 'price.amount': -1 };
    if (sort === 'ratingDesc') return { 'attributes.rating': -1, 'attributes.stars': -1 };
    return { createdAt: -1 };
  })();

  let favoritesSet = new Set();
  if (userId) {
    const favorites = await UserFavorite.find({ user: userId }).select('product').lean();
    favoritesSet = new Set(favorites.map((f) => f.product?.toString()));
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate({ path: 'company', select: 'displayName complianceStatus contact.phone' })
      .sort(sortOptions)
      .skip(offset)
      .limit(limit)
      .lean(),
    Product.countDocuments(query)
  ]);

  return {
    products: products.map((p) => ({
      ...p,
      isFavorite: favoritesSet.has(p._id?.toString())
    })),
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
  { limit = 20, offset = 0, category, status, search, visibility, userId, excludeUserId, createdByRole } = {}
) => {
  const query = { deletedAt: { $exists: false } };

  if (companyId) {
    query.company = new mongoose.Types.ObjectId(companyId);
  }
  if (excludeUserId) {
    query.createdBy = { $ne: new mongoose.Types.ObjectId(excludeUserId) };
  }
  if (createdByRole) {
    const adminFilter = await buildAdminCreatorFilter(createdByRole);
    if (adminFilter) {
      query.$or = adminFilter.$or;
    } else {
      query.createdByRole = createdByRole;
    }
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

  let favoritesSet = new Set();
  if (userId) {
    const favorites = await UserFavorite.find({ user: userId }).select('product').lean();
    favoritesSet = new Set(favorites.map((f) => f.product?.toString()));
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
    products: products.map((p) => ({
      ...p,
      isFavorite: favoritesSet.has(p._id?.toString())
    })),
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

const createProduct = async (payload, userId, companyId, creatorRole = 'user') => {
  // Clean empty SKU to avoid unique constraint issues (sparse index skips null/undefined but not empty string)
  const cleanedPayload = { ...payload };
  if (cleanedPayload.sku === '' || cleanedPayload.sku === null) {
    delete cleanedPayload.sku;
  }

  const product = new Product({
    ...cleanedPayload,
    company: companyId,
    createdBy: userId,
    createdByRole: creatorRole || 'user',
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

  // Clean empty SKU to avoid unique constraint issues
  const cleanedUpdates = { ...updates };
  if (cleanedUpdates.createdByRole) {
    delete cleanedUpdates.createdByRole;
  }
  if (cleanedUpdates.sku === '' || cleanedUpdates.sku === null) {
    cleanedUpdates.sku = undefined; // Use $unset behavior
  }

  const product = await Product.findOneAndUpdate(
    query,
    { ...cleanedUpdates, lastUpdatedBy: userId, updatedAt: new Date() },
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
