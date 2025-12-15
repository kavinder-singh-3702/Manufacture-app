const { Router } = require('express');
const healthRouter = require('./health.routes');
const authRouter = require('../modules/auth/routes/auth.routes');
const userRouter = require('./user.routes');
const companyRouter = require('../modules/company/routes/company.routes');
const activityRouter = require('../modules/activity/routes/activity.routes');
const companyVerificationAdminRouter = require('../modules/companyVerification/routes/companyVerificationAdmin.routes');
const adminRouter = require('../modules/admin/routes/admin.routes');
const productRouter = require('../modules/product/routes/product.routes');

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/companies', companyRouter);
router.use('/activity', activityRouter);
router.use('/verification-requests', companyVerificationAdminRouter);
router.use('/admin', adminRouter);
router.use('/products', productRouter);

module.exports = router;
