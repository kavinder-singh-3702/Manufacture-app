const createError = require('http-errors');
const {
  listVariants,
  getVariantById,
  createVariant,
  updateVariant,
  adjustVariantQuantity,
  deleteVariant,
  listVariantLogs
} = require('../services/productVariant.service');

const ACTIVE_COMPANY_REQUIRED_CODE = 'ACTIVE_COMPANY_REQUIRED';

const resolveScopeCompanyId = (scope, user) => {
  if (scope === 'company' && !user?.activeCompany) {
    throw createError(400, 'No active company selected', { code: ACTIVE_COMPANY_REQUIRED_CODE });
  }
  return scope === 'company' ? user?.activeCompany : scope === 'marketplace' ? undefined : user?.activeCompany;
};

const listProductVariantsController = async (req, res, next) => {
  try {
    const { scope } = req.query;
    const companyId = resolveScopeCompanyId(scope, req.user);
    const { productId } = req.params;
    const { limit, offset, status } = req.query;

    const result = await listVariants(productId, companyId, { limit, offset, status });
    if (!result) {
      throw createError(404, 'Product not found');
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getProductVariantController = async (req, res, next) => {
  try {
    const { scope } = req.query;
    const companyId = resolveScopeCompanyId(scope, req.user);
    const { productId, variantId } = req.params;

    const variant = await getVariantById(productId, variantId, companyId);
    if (!variant) {
      throw createError(404, 'Variant not found');
    }

    return res.json({ variant });
  } catch (error) {
    return next(error);
  }
};

const createProductVariantController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.activeCompany;
    const { productId } = req.params;

    if (!companyId) {
      throw createError(400, 'No active company selected');
    }

    const variant = await createVariant(productId, companyId, req.body, userId);
    if (!variant) {
      throw createError(404, 'Product not found');
    }

    return res.status(201).json({ variant, message: 'Variant created successfully' });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Variant already exists (duplicate SKU or option combination)' });
    }
    return next(error);
  }
};

const updateProductVariantController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.activeCompany;
    const { productId, variantId } = req.params;

    if (!companyId) {
      throw createError(400, 'No active company selected');
    }

    const variant = await updateVariant(productId, variantId, req.body, userId, companyId);
    if (!variant) {
      throw createError(404, 'Variant not found');
    }

    return res.json({ variant });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Variant already exists (duplicate SKU or option combination)' });
    }
    return next(error);
  }
};

const adjustVariantQuantityController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.activeCompany;
    const { productId, variantId } = req.params;
    const parsedAdjustment = Number(req.body?.adjustment);

    if (!companyId) {
      throw createError(400, 'No active company selected');
    }

    if (Number.isNaN(parsedAdjustment)) {
      throw createError(400, 'Adjustment must be a number');
    }

    const variant = await adjustVariantQuantity(productId, variantId, parsedAdjustment, userId, companyId);
    if (!variant) {
      throw createError(404, 'Variant not found');
    }

    return res.json({ variant });
  } catch (error) {
    return next(error);
  }
};

const deleteProductVariantController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.activeCompany;
    const { productId, variantId } = req.params;

    if (!companyId) {
      throw createError(400, 'No active company selected');
    }

    const deleted = await deleteVariant(productId, variantId, userId, companyId);
    if (!deleted) {
      throw createError(404, 'Variant not found');
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

const listVariantLogsController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const { productId } = req.params;

    if (!companyId) {
      throw createError(400, 'No active company selected');
    }

    const result = await listVariantLogs(productId, companyId, {
      limit: req.query.limit,
      offset: req.query.offset,
      variantId: req.query.variantId,
      action: req.query.action
    });

    if (!result) {
      throw createError(404, 'Product not found');
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listProductVariantsController,
  getProductVariantController,
  createProductVariantController,
  updateProductVariantController,
  adjustVariantQuantityController,
  deleteProductVariantController,
  listVariantLogsController
};
