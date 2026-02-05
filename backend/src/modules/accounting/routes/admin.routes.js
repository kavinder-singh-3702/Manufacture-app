const { Router } = require('express');
const { authorizeRoles } = require('../../../middleware/authMiddleware');
const { bootstrapAllCompanyBooksController } = require('../controllers/admin.controller');

const router = Router();

router.post('/bootstrap', authorizeRoles('admin'), bootstrapAllCompanyBooksController);

module.exports = router;

