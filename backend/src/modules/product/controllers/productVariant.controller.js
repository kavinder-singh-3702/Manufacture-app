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

const listProductVariantsController = async (req, res, next) => {
  try {
    const { scope } = req.query;
    // Same owner-or-public rule as the parent product's GET /products/:id —
    // a missing/marketplace scope must not default to the viewer's own
    // company, or the variant panel 404s on any product the viewer doesn't own.
    if (scope === 'company' && !req.user?.activeCompany) {
      throw createError(400, 'No active company selected', { code: ACTIVE_COMPANY_REQUIRED_CODE });
    }
    const { productId } = req.params;
    const { limit, offset, status } = req.query;

    const result = await listVariants(productId, {
      viewerCompanyId: req.user?.activeCompany,
      ownerOnly: scope === 'company',
      limit,
      offset,
      status
    });
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
    if (scope === 'company' && !req.user?.activeCompany) {
      throw createError(400, 'No active company selected', { code: ACTIVE_COMPANY_REQUIRED_CODE });
    }
    const { productId, variantId } = req.params;

    const variant = await getVariantById(productId, variantId, {
      viewerCompanyId: req.user?.activeCompany,
      ownerOnly: scope === 'company'
    });
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
      return next(createError(400, 'Variant already exists (duplicate SKU or option combination)'));
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
      return next(createError(400, 'Variant already exists (duplicate SKU or option combination)'));
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
