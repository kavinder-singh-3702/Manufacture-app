const { Router } = require('express');
const healthRouter = require('./health.routes');
const authRouter = require('../modules/auth/routes/auth.routes');
const userRouter = require('./user.routes');
const companyRouter = require('../modules/company/routes/company.routes');
const activityRouter = require('../modules/activity/routes/activity.routes');
const companyVerificationAdminRouter = require('../modules/companyVerification/routes/companyVerificationAdmin.routes');
const adminRouter = require('../modules/admin/routes/admin.routes');
const productRouter = require('../modules/product/routes/product.routes');
const chatRouter = require('../modules/chat/routes/chat.routes');
const preferenceRouter = require('../modules/preferences/routes/preference.routes');
const favoritesRouter = require('../modules/userFavorites/favorites.routes');
const servicesRouter = require('../modules/services/routes/service.routes');
const notificationRouter = require('../modules/notifications/routes/notification.routes');
const accountingRouter = require('../modules/accounting/routes/accounting.routes');
const quoteRouter = require('../modules/quotes/routes/quote.routes');

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/companies', companyRouter);
router.use('/activity', activityRouter);
router.use('/verification-requests', companyVerificationAdminRouter);
router.use('/admin', adminRouter);
router.use('/products', productRouter);
router.use('/chat', chatRouter);
router.use('/preferences', preferenceRouter);
router.use('/favorites', favoritesRouter);
router.use('/services', servicesRouter);
router.use('/notifications', notificationRouter);
router.use('/accounting', accountingRouter);
router.use('/quotes', quoteRouter);

module.exports = router;
