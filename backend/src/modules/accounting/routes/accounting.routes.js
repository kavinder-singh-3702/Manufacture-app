const { Router } = require('express');
const { authenticate } = require('../../../middleware/authMiddleware');
const accountsRouter = require('./accounts.routes');
const partiesRouter = require('./parties.routes');
const unitsRouter = require('./units.routes');
const vouchersRouter = require('./vouchers.routes');
const reportsRouter = require('./reports.routes');
const adminRouter = require('./admin.routes');

const router = Router();

router.use(authenticate);

router.use('/accounts', accountsRouter);
router.use('/parties', partiesRouter);
router.use('/units', unitsRouter);
router.use('/vouchers', vouchersRouter);
router.use('/reports', reportsRouter);
router.use('/admin', adminRouter);

module.exports = router;

