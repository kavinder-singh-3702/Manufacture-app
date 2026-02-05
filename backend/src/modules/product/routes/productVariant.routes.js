const { Router } = require('express');
const { authenticate, authenticateOptional } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const { productIdParamValidation } = require('../validators/product.validators');
const {
  variantIdParamValidation,
  listVariantsQueryValidation,
  createVariantValidation,
  updateVariantValidation,
  adjustVariantQuantityValidation,
  variantLogsQueryValidation
} = require('../validators/productVariant.validators');
const {
  listProductVariantsController,
  getProductVariantController,
  createProductVariantController,
  updateProductVariantController,
  adjustVariantQuantityController,
  deleteProductVariantController,
  listVariantLogsController
} = require('../controllers/productVariant.controller');

const router = Router({ mergeParams: true });

router.get('/', authenticateOptional, validate([...productIdParamValidation, ...listVariantsQueryValidation]), listProductVariantsController);
router.post('/', authenticate, validate([...productIdParamValidation, ...createVariantValidation]), createProductVariantController);

// Logs (company-scoped)
router.get('/logs', authenticate, validate([...productIdParamValidation, ...variantLogsQueryValidation]), listVariantLogsController);

router.get(
  '/:variantId',
  authenticateOptional,
  validate([...productIdParamValidation, ...variantIdParamValidation]),
  getProductVariantController
);
router.put(
  '/:variantId',
  authenticate,
  validate([...productIdParamValidation, ...variantIdParamValidation, ...updateVariantValidation]),
  updateProductVariantController
);
router.patch(
  '/:variantId/quantity',
  authenticate,
  validate([...productIdParamValidation, ...variantIdParamValidation, ...adjustVariantQuantityValidation]),
  adjustVariantQuantityController
);
router.delete(
  '/:variantId',
  authenticate,
  validate([...productIdParamValidation, ...variantIdParamValidation]),
  deleteProductVariantController
);

module.exports = router;

