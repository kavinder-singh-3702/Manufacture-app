const { body, param, query } = require('express-validator');
const {
  SERVICE_TYPES,
  SERVICE_STATUSES,
  SERVICE_PRIORITIES,
  MACHINE_TYPE_IDS,
  WORKER_INDUSTRY_IDS,
  WORKER_EXPERIENCE_LEVELS,
  SHIFT_TYPES,
  CONTRACT_TYPES,
  TRANSPORT_MODES
} = require('../../../constants/services');

const serviceIdParamValidation = [param('serviceId').isMongoId().withMessage('Valid service id is required')];

const locationValidation = (field) => [
  body(`${field}`).optional().isObject(),
  body(`${field}.line1`).optional().isString().isLength({ max: 200 }),
  body(`${field}.line2`).optional().isString().isLength({ max: 200 }),
  body(`${field}.city`).optional().isString().isLength({ max: 120 }),
  body(`${field}.state`).optional().isString().isLength({ max: 120 }),
  body(`${field}.country`).optional().isString().isLength({ max: 120 }),
  body(`${field}.postalCode`).optional().isString().isLength({ max: 20 }),
  body(`${field}.coordinates`).optional().isObject(),
  body(`${field}.coordinates.lat`).optional().isFloat(),
  body(`${field}.coordinates.lng`).optional().isFloat()
];

const availabilityValidation = (field) => [
  body(field).optional().isObject(),
  body(`${field}.startDate`).optional().isISO8601().toDate(),
  body(`${field}.endDate`).optional().isISO8601().toDate(),
  body(`${field}.isFlexible`).optional().isBoolean(),
  body(`${field}.notes`).optional().isString().isLength({ max: 500 })
];

const contactValidation = [
  body('contact').optional().isObject(),
  body('contact.name').optional().isString().isLength({ max: 120 }),
  body('contact.email').optional().isEmail(),
  body('contact.phone').optional().isString().isLength({ max: 50 }),
  body('contact.preferredChannel').optional().isIn(['phone', 'email', 'chat'])
];

const baseServiceFields = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('priority').optional().isIn(SERVICE_PRIORITIES),
  body('status').optional().isIn(SERVICE_STATUSES),
  body('notes').optional().isString().isLength({ max: 2000 }),
  ...contactValidation,
  ...locationValidation('location'),
  ...availabilityValidation('schedule'),
  body('budget').optional().isObject(),
  body('budget.estimatedCost').optional().isFloat({ min: 0 }),
  body('budget.currency').optional().isString(),
  body('budget.notes').optional().isString().isLength({ max: 300 }),
  body('assignedTo').optional().isMongoId(),
  body('company').optional().isMongoId()
];

const machineRepairValidation = [
  body('machineRepairDetails')
    .if(body('serviceType').equals('machine_repair'))
    .notEmpty()
    .withMessage('Machine repair details are required'),
  body('machineRepairDetails.machineType')
    .if(body('serviceType').equals('machine_repair'))
    .isIn(MACHINE_TYPE_IDS)
    .withMessage('Invalid machine type'),
  body('machineRepairDetails.machineName').optional().isString().isLength({ max: 200 }),
  body('machineRepairDetails.manufacturer').optional().isString().isLength({ max: 120 }),
  body('machineRepairDetails.model').optional().isString().isLength({ max: 120 }),
  body('machineRepairDetails.issueSummary')
    .if(body('serviceType').equals('machine_repair'))
    .notEmpty()
    .isString()
    .isLength({ max: 300 }),
  body('machineRepairDetails.issueDetails').optional().isString().isLength({ max: 2000 }),
  body('machineRepairDetails.severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('machineRepairDetails.requiresDowntime').optional().isBoolean(),
  body('machineRepairDetails.warrantyStatus').optional().isIn(['in_warranty', 'out_of_warranty', 'unknown']),
  ...availabilityValidation('machineRepairDetails.preferredSchedule')
];

const workerValidation = [
  body('workerDetails')
    .if(body('serviceType').equals('worker'))
    .notEmpty()
    .withMessage('Worker requirements are required'),
  body('workerDetails.industry')
    .if(body('serviceType').equals('worker'))
    .isIn(WORKER_INDUSTRY_IDS)
    .withMessage('Invalid industry'),
  body('workerDetails.roles').optional().isArray(),
  body('workerDetails.roles.*').optional().isString().isLength({ max: 120 }),
  body('workerDetails.headcount')
    .if(body('serviceType').equals('worker'))
    .isInt({ min: 1 })
    .withMessage('Headcount must be at least 1'),
  body('workerDetails.experienceLevel').optional().isIn(WORKER_EXPERIENCE_LEVELS),
  body('workerDetails.shiftType').optional().isIn(SHIFT_TYPES),
  body('workerDetails.contractType').optional().isIn(CONTRACT_TYPES),
  body('workerDetails.startDate').optional().isISO8601().toDate(),
  body('workerDetails.durationWeeks').optional().isInt({ min: 0 }),
  body('workerDetails.skills').optional().isArray(),
  body('workerDetails.skills.*').optional().isString().isLength({ max: 120 }),
  body('workerDetails.certifications').optional().isArray(),
  body('workerDetails.certifications.*').optional().isString().isLength({ max: 120 }),
  body('workerDetails.safetyClearances').optional().isArray(),
  body('workerDetails.safetyClearances.*').optional().isString().isLength({ max: 120 }),
  body('workerDetails.languagePreferences').optional().isArray(),
  body('workerDetails.languagePreferences.*').optional().isString().isLength({ max: 50 }),
  body('workerDetails.budgetPerWorker').optional().isObject(),
  body('workerDetails.budgetPerWorker.amount').optional().isFloat({ min: 0 }),
  body('workerDetails.budgetPerWorker.currency').optional().isString()
];

const transportValidation = [
  body('transportDetails')
    .if(body('serviceType').equals('transport'))
    .notEmpty()
    .withMessage('Transport details are required'),
  body('transportDetails.mode').optional().isIn(TRANSPORT_MODES),
  ...locationValidation('transportDetails.pickupLocation'),
  ...locationValidation('transportDetails.dropLocation'),
  body('transportDetails.loadType').optional().isString().isLength({ max: 200 }),
  body('transportDetails.loadWeightTons').optional().isFloat({ min: 0 }),
  body('transportDetails.vehicleType').optional().isString().isLength({ max: 120 }),
  body('transportDetails.requiresReturnTrip').optional().isBoolean(),
  ...availabilityValidation('transportDetails.availability'),
  body('transportDetails.specialHandling').optional().isString().isLength({ max: 500 }),
  body('transportDetails.insuranceNeeded').optional().isBoolean()
];

const createServiceRequestValidation = [
  body('serviceType').isIn(SERVICE_TYPES).withMessage('Service type is required'),
  ...baseServiceFields,
  ...machineRepairValidation,
  ...workerValidation,
  ...transportValidation
];

const updateServiceRequestValidation = [
  body('serviceType').optional().isIn(SERVICE_TYPES),
  ...baseServiceFields,
  ...machineRepairValidation,
  ...workerValidation,
  ...transportValidation
];

const updateServiceStatusValidation = [
  body('status').isIn(SERVICE_STATUSES).withMessage('Status is required'),
  body('notes').optional().isString().isLength({ max: 2000 })
];

const listServiceRequestsValidation = [
  query('serviceType').optional().isIn(SERVICE_TYPES),
  query('status').optional().isIn(SERVICE_STATUSES),
  query('priority').optional().isIn(SERVICE_PRIORITIES),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('sort').optional().isIn(['newest', 'oldest', 'priority']),
  query('companyId').optional().isMongoId(),
  query('createdBy').optional().isMongoId(),
  query('assignedTo').optional().isMongoId()
];

module.exports = {
  createServiceRequestValidation,
  updateServiceRequestValidation,
  updateServiceStatusValidation,
  listServiceRequestsValidation,
  serviceIdParamValidation
};
