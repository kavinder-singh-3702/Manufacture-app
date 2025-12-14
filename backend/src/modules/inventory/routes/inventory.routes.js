const { Router } = require('express');
const { authenticate } = require('../../../middleware/authMiddleware');
const {
  getCategoryStatsController,
  getItemsByCategoryController,
  getAllItemsController,
  getItemByIdController,
  createItemController,
  updateItemController,
  adjustQuantityController,
  deleteItemController,
  getInventoryStatsController
} = require('../controllers/inventory.controller');

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// Category routes
router.get('/categories', getCategoryStatsController);
router.get('/categories/:categoryId/items', getItemsByCategoryController);

// Stats route
router.get('/stats', getInventoryStatsController);

// Item CRUD routes
router.get('/items', getAllItemsController);
router.get('/items/:itemId', getItemByIdController);
router.post('/items', createItemController);
router.put('/items/:itemId', updateItemController);
router.patch('/items/:itemId/quantity', adjustQuantityController);
router.delete('/items/:itemId', deleteItemController);

module.exports = router;
