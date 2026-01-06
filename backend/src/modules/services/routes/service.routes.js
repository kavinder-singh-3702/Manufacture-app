const { Router } = require('express');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  createServiceRequestController,
  listServiceRequestsController,
  getServiceRequestController,
  updateServiceRequestController,
  updateServiceStatusController
} = require('../controllers/service.controller');
const {
  createServiceRequestValidation,
  updateServiceRequestValidation,
  updateServiceStatusValidation,
  listServiceRequestsValidation,
  serviceIdParamValidation
} = require('../validators/service.validators');

const router = Router();

router.use(authenticate);

router
  .route('/')
  .get(validate(listServiceRequestsValidation), listServiceRequestsController)
  .post(validate(createServiceRequestValidation), createServiceRequestController);

router
  .route('/:serviceId')
  .get(validate(serviceIdParamValidation), getServiceRequestController)
  .put(validate([...serviceIdParamValidation, ...updateServiceRequestValidation]), updateServiceRequestController);

router.patch(
  '/:serviceId/status',
  authorizeRoles('admin'),
  validate([...serviceIdParamValidation, ...updateServiceStatusValidation]),
  updateServiceStatusController
);

module.exports = router;
