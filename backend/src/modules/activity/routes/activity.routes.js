const { Router } = require('express');
const { listUserActivity } = require('../controllers/activity.controller');
const { authenticate } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const { activityQueryValidation } = require('../validators/activity.validators');

const router = Router();

router.use(authenticate);
router.get('/', validate(activityQueryValidation), listUserActivity);

module.exports = router;
