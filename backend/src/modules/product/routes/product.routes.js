const { Router } = require('express');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
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

router.use(authenticate);

// Categories and stats
router.get('/categories', getCategoryStatsController);
router.get(
  '/categories/:categoryId/products',
  validate(categoryIdParamValidation),
  getProductsByCategoryController
);
router.get('/stats', getProductStatsController);

// Core CRUD
router.get('/', listProductsController);
router.get('/:productId', validate(productIdParamValidation), getProductController);
router.post('/', validate(createProductValidation), createProductController);
router.put('/:productId', validate([...productIdParamValidation, ...updateProductValidation]), updateProductController);
router.patch(
  '/:productId/quantity',
  validate([...productIdParamValidation, ...adjustQuantityValidation]),
  adjustQuantityController
);
router.delete('/:productId', validate(productIdParamValidation), deleteProductController);

// Admin-only targeted discounts
router.post(
  '/:productId/discounts',
  authorizeRoles('admin'),
  validate([...productIdParamValidation, ...applyDiscountValidation]),
  applyDiscountController
);

// Media uploads
router.post(
  '/:productId/images',
  validate([...productIdParamValidation, ...uploadProductImageValidation]),
  uploadProductImageController
);

module.exports = router;
