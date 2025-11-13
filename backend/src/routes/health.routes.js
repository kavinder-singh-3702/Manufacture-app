const { Router } = require('express');
const { getHealthStatus } = require('../controllers/health.controller');

const router = Router();

router.get('/', getHealthStatus);

module.exports = router;
