const createError = require('http-errors');
const {
  getCategoryStats,
  getProductsByCategory,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustQuantity,
  deleteProduct,
  getProductStats,
  applyTargetedDiscount,
  addProductImage
} = require('../services/product.service');

const normalizeCreatorRole = (role) => {
  const value = typeof role === 'string' ? role.toLowerCase() : undefined;
  return value === 'admin' || value === 'user' ? value : undefined;
};

const getCategoryStatsController = async (req, res, next) => {
  try {
    const { scope, createdByRole: createdByRoleQuery } = req.query;
    const companyId = scope === 'company' ? req.user?.activeCompany : scope === 'marketplace' ? undefined : req.user?.activeCompany;
    const normalizedRole = normalizeCreatorRole(createdByRoleQuery);
    const createdByRole = normalizedRole;

    const result = await getCategoryStats(companyId, { createdByRole });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getProductsByCategoryController = async (req, res, next) => {
  try {
    const { scope, createdByRole: createdByRoleQuery } = req.query;
    const companyId = scope === 'company' ? req.user?.activeCompany : scope === 'marketplace' ? undefined : req.user?.activeCompany;
    const { categoryId } = req.params;
    const { limit, offset, status, minPrice, maxPrice, sort } = req.query;
    const normalizedRole = normalizeCreatorRole(createdByRoleQuery);
    const createdByRole = normalizedRole;

    const result = await getProductsByCategory(companyId, categoryId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      status,
      minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined,
      sort,
      userId: req.user?.id,
      createdByRole
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const listProductsController = async (req, res, next) => {
  try {
    const { scope, createdByRole: createdByRoleQuery } = req.query;
    const companyId = scope === 'company' ? req.user?.activeCompany : scope === 'marketplace' ? undefined : req.user?.activeCompany;
    const { limit, offset, category, status, search, visibility } = req.query;
    const normalizedRole = normalizeCreatorRole(createdByRoleQuery);
    const createdByRole = normalizedRole;

    const result = await getAllProducts(companyId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      category,
      status,
      search,
      visibility,
      userId: req.user?.id,
      createdByRole
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getProductController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const product = await getProductById(req.params.productId, companyId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product });
  } catch (error) {
    return next(error);
  }
};

const createProductController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.activeCompany;
    const creatorRole = req.user?.role || 'user';

    if (!companyId) {
      return res.status(400).json({ error: 'No active company selected' });
    }

    const product = await createProduct(req.body, userId, companyId, creatorRole);
    return res.status(201).json({ product, message: 'Product created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A product with this SKU already exists' });
    }
    return next(error);
  }
};

const updateProductController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.activeCompany;

    const product = await updateProduct(req.params.productId, req.body, userId, companyId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A product with this SKU already exists' });
    }
    return next(error);
  }
};

const adjustQuantityController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.activeCompany;
    const { productId } = req.params;
    const { adjustment } = req.body;
    const parsedAdjustment = Number(adjustment);

    if (Number.isNaN(parsedAdjustment)) {
      return res.status(400).json({ error: 'Adjustment must be a number' });
    }

    const product = await adjustQuantity(productId, parsedAdjustment, userId, companyId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product });
  } catch (error) {
    return next(error);
  }
};

const deleteProductController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const { productId } = req.params;

    const deleted = await deleteProduct(productId, companyId);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

const getProductStatsController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const stats = await getProductStats(companyId);
    return res.json(stats);
  } catch (error) {
    return next(error);
  }
};

const applyDiscountController = async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      throw createError(403, 'Only admins can apply targeted discounts');
    }

    const companyId = req.user?.activeCompany;
    const product = await applyTargetedDiscount(req.params.productId, companyId, req.body, req.user.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product });
  } catch (error) {
    return next(error);
  }
};

const uploadProductImageController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const userId = req.user?.id;

    const result = await addProductImage(req.params.productId, companyId, req.body, userId);
    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCategoryStatsController,
  getProductsByCategoryController,
  listProductsController,
  getProductController,
  createProductController,
  updateProductController,
  adjustQuantityController,
  deleteProductController,
  getProductStatsController,
  applyDiscountController,
  uploadProductImageController
};
