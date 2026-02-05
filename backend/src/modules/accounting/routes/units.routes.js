const { Router } = require('express');
const validate = require('../../../middleware/validate');
const {
  listUnitsController,
  createUnitController,
  updateUnitController,
  deleteUnitController
} = require('../controllers/unit.controller');
const {
  unitIdParamValidation,
  createUnitValidation,
  updateUnitValidation
} = require('../validators/units.validators');

const router = Router();

router.get('/', listUnitsController);
router.post('/', validate(createUnitValidation), createUnitController);
router.put('/:unitId', validate([...unitIdParamValidation, ...updateUnitValidation]), updateUnitController);
router.delete('/:unitId', validate(unitIdParamValidation), deleteUnitController);

module.exports = router;

