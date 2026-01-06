const createError = require('http-errors');
const {
  createServiceRequest,
  listServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  updateServiceStatus
} = require('../services/serviceRequest.service');
const { SERVICE_STATUSES } = require('../../../constants/services');

const createServiceRequestController = async (req, res, next) => {
  try {
    const service = await createServiceRequest(req.body, req.user);
    return res.status(201).json({ service, message: 'Service request captured' });
  } catch (error) {
    return next(error);
  }
};

const listServiceRequestsController = async (req, res, next) => {
  try {
    const result = await listServiceRequests(req.user, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getServiceRequestController = async (req, res, next) => {
  try {
    const service = await getServiceRequestById(req.params.serviceId, req.user);
    if (!service) {
      return next(createError(404, 'Service request not found'));
    }
    return res.json({ service });
  } catch (error) {
    return next(error);
  }
};

const updateServiceRequestController = async (req, res, next) => {
  try {
    const service = await updateServiceRequest(req.params.serviceId, req.body, req.user);
    if (!service) {
      return next(createError(404, 'Service request not found or not accessible'));
    }
    return res.json({ service, message: 'Service request updated' });
  } catch (error) {
    return next(error);
  }
};

const updateServiceStatusController = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    if (!SERVICE_STATUSES.includes(status)) {
      return next(createError(400, 'Invalid status value'));
    }

    const service = await updateServiceStatus(req.params.serviceId, status, req.user, notes);
    if (!service) {
      return next(createError(404, 'Service request not found or not accessible'));
    }

    return res.json({ service, message: 'Status updated' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createServiceRequestController,
  listServiceRequestsController,
  getServiceRequestController,
  updateServiceRequestController,
  updateServiceStatusController
};
