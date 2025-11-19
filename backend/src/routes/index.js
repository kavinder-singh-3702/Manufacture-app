const { Router } = require('express');
const healthRouter = require('./health.routes');
const authRouter = require('../modules/auth/routes/auth.routes');
const userRouter = require('./user.routes');
const verificationRouter = require('./verification.routes');
const companyRouter = require('../modules/company/routes/company.routes');
const companyVerificationAdminRouter = require('../modules/companyVerification/routes/companyVerificationAdmin.routes');

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/verification', verificationRouter);
router.use('/companies', companyRouter);
router.use('/verification-requests', companyVerificationAdminRouter);

module.exports = router;
