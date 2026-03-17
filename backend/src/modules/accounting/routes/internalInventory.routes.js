const { Router } = require('express');
const validate = require('../../../middleware/validate');
const {
  getDashboardController,
  listItemsController,
  getItemController,
  createItemController,
  updateItemController,
  deleteItemController,
  adjustItemController,
  listItemMovementsController
} = require('../controllers/internalInventory.controller');
const {
  itemIdParamValidation,
  listItemsValidation,
  createItemValidation,
  updateItemValidation,
  adjustItemValidation,
  listMovementsValidation
} = require('../validators/internalInventory.validators');

const router = Router();

router.get('/dashboard', getDashboardController);
router.get('/items', validate(listItemsValidation), listItemsController);
router.post('/items', validate(createItemValidation), createItemController);
router.get('/items/:itemId', validate(itemIdParamValidation), getItemController);
router.put('/items/:itemId', validate([...itemIdParamValidation, ...updateItemValidation]), updateItemController);
router.delete('/items/:itemId', validate(itemIdParamValidation), deleteItemController);
router.post('/items/:itemId/adjust', validate([...itemIdParamValidation, ...adjustItemValidation]), adjustItemController);
router.get(
  '/items/:itemId/movements',
  validate([...itemIdParamValidation, ...listMovementsValidation]),
  listItemMovementsController
);

module.exports = router;
