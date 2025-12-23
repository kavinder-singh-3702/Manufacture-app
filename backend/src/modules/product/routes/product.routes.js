const { Router } = require('express');
const { authenticate, authenticateOptional, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
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
} = require('../controllers/product.controller');
const {
  createProductValidation,
  updateProductValidation,
  productIdParamValidation,
  categoryIdParamValidation,
  applyDiscountValidation,
  uploadProductImageValidation,
  adjustQuantityValidation
} = require('../validators/product.validators');

const router = Router();

// Categories and stats
router.get('/categories', authenticateOptional, getCategoryStatsController);
router.get(
  '/categories/:categoryId/products',
  authenticateOptional,
  validate(categoryIdParamValidation),
  getProductsByCategoryController
);
router.get('/stats', authenticate, getProductStatsController);

// Core CRUD
router.get('/', authenticateOptional, listProductsController);
router.get('/:productId', authenticateOptional, validate(productIdParamValidation), getProductController);
router.post('/', authenticate, validate(createProductValidation), createProductController);
router.put('/:productId', authenticate, validate([...productIdParamValidation, ...updateProductValidation]), updateProductController);
router.patch(
  '/:productId/quantity',
  authenticate,
  validate([...productIdParamValidation, ...adjustQuantityValidation]),
  adjustQuantityController
);
router.delete('/:productId', authenticate, validate(productIdParamValidation), deleteProductController);

// Admin-only targeted discounts
router.post(
  '/:productId/discounts',
  authenticate,
  authorizeRoles('admin'),
  validate([...productIdParamValidation, ...applyDiscountValidation]),
  applyDiscountController
);

// Media uploads
router.post(
  '/:productId/images',
  authenticate,
  validate([...productIdParamValidation, ...uploadProductImageValidation]),
  uploadProductImageController
);

module.exports = router;
