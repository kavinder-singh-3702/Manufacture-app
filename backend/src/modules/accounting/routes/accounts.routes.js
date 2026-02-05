const { Router } = require('express');
const validate = require('../../../middleware/validate');
const {
  listAccountsController,
  getAccountController,
  createAccountController,
  updateAccountController,
  deleteAccountController
} = require('../controllers/account.controller');
const {
  accountIdParamValidation,
  listAccountsValidation,
  createAccountValidation,
  updateAccountValidation
} = require('../validators/accounts.validators');

const router = Router();

router.get('/', validate(listAccountsValidation), listAccountsController);
router.post('/', validate(createAccountValidation), createAccountController);
router.get('/:accountId', validate(accountIdParamValidation), getAccountController);
router.put('/:accountId', validate([...accountIdParamValidation, ...updateAccountValidation]), updateAccountController);
router.delete('/:accountId', validate(accountIdParamValidation), deleteAccountController);

module.exports = router;

