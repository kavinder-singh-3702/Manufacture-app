const { Router } = require('express');
const validate = require('../../../middleware/validate');
const {
  listPartiesController,
  getPartyController,
  createPartyController,
  updatePartyController,
  deletePartyController
} = require('../controllers/party.controller');
const {
  partyIdParamValidation,
  listPartiesValidation,
  createPartyValidation,
  updatePartyValidation,
  deletePartyValidation
} = require('../validators/parties.validators');

const router = Router();

router.get('/', validate(listPartiesValidation), listPartiesController);
router.post('/', validate(createPartyValidation), createPartyController);
router.get('/:partyId', validate(partyIdParamValidation), getPartyController);
router.put('/:partyId', validate([...partyIdParamValidation, ...updatePartyValidation]), updatePartyController);
router.delete('/:partyId', validate([...partyIdParamValidation, ...deletePartyValidation]), deletePartyController);

module.exports = router;

