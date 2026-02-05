const { Router } = require('express');
const validate = require('../../../middleware/validate');
const {
  listVouchersController,
  getVoucherController,
  createVoucherController,
  updateVoucherController,
  postDraftVoucherController,
  voidVoucherController,
  listVoucherLogsController
} = require('../controllers/voucher.controller');
const {
  voucherIdParamValidation,
  listVouchersValidation,
  createVoucherValidation,
  updateVoucherValidation,
  voidVoucherValidation,
  voucherLogsValidation
} = require('../validators/vouchers.validators');

const router = Router();

router.get('/', validate(listVouchersValidation), listVouchersController);
router.post('/', validate(createVoucherValidation), createVoucherController);
router.get('/:voucherId', validate(voucherIdParamValidation), getVoucherController);
router.put('/:voucherId', validate([...voucherIdParamValidation, ...updateVoucherValidation]), updateVoucherController);
router.post('/:voucherId/post', validate(voucherIdParamValidation), postDraftVoucherController);
router.post('/:voucherId/void', validate([...voucherIdParamValidation, ...voidVoucherValidation]), voidVoucherController);
router.get('/:voucherId/logs', validate([...voucherIdParamValidation, ...voucherLogsValidation]), listVoucherLogsController);

module.exports = router;

