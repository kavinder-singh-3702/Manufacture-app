const { Router } = require('express');
const { getCurrentUser, updateCurrentUser, uploadUserFile } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { updateProfileValidation, uploadUserFileValidation } = require('../validators/user.validators');

const router = Router();

router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, validate(updateProfileValidation), updateCurrentUser);
router.post('/me/uploads', authenticate, validate(uploadUserFileValidation), uploadUserFile);

module.exports = router;
