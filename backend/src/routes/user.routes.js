const { Router } = require('express');
const { getCurrentUser, updateCurrentUser } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { updateProfileValidation } = require('../validators/user.validators');

const router = Router();

router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, validate(updateProfileValidation), updateCurrentUser);

module.exports = router;
