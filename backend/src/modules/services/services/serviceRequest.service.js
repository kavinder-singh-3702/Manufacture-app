const mongoose = require('mongoose');
const ServiceRequest = require('../../../models/serviceRequest.model');
const {
  SERVICE_TYPES,
  SERVICE_STATUSES,
  SERVICE_PRIORITIES
} = require('../../../constants/services');

const toObjectId = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  return undefined;
};

const isAdmin = (user) => user?.role === 'admin';

const normalizeTypeSpecificDetails = (payload, serviceType) => {
  const normalized = { ...payload };
  if (!serviceType && payload.serviceType && SERVICE_TYPES.includes(payload.serviceType)) {
    serviceType = payload.serviceType;
  }

  if (serviceType === 'machine_repair') {
    normalized.workerDetails = undefined;
    normalized.transportDetails = undefined;
  } else if (serviceType === 'worker') {
    normalized.machineRepairDetails = undefined;
    normalized.transportDetails = undefined;
  } else if (serviceType === 'transport') {
    normalized.machineRepairDetails = undefined;
    normalized.workerDetails = undefined;
  }

  return normalized;
};

const buildUnsetForType = (serviceType) => {
  if (serviceType === 'machine_repair') {
    return { workerDetails: '', transportDetails: '' };
  }
  if (serviceType === 'worker') {
    return { machineRepairDetails: '', transportDetails: '' };
  }
  if (serviceType === 'transport') {
    return { machineRepairDetails: '', workerDetails: '' };
  }
  return {};
};

const buildScopedQuery = (user, base = {}) => {
  const query = { ...base, deletedAt: { $exists: false } };
  if (!isAdmin(user)) {
    query.createdBy = toObjectId(user?.id);
  }
  return query;
};

const createServiceRequest = async (payload, user) => {
  const scopedPayload = normalizeTypeSpecificDetails(payload, payload.serviceType);
  scopedPayload.createdBy = toObjectId(user?.id);
  scopedPayload.createdByRole = isAdmin(user) ? 'admin' : 'user';
  scopedPayload.company = toObjectId(user?.activeCompany);
  scopedPayload.lastUpdatedBy = toObjectId(user?.id);

  if (!isAdmin(user)) {
    scopedPayload.status = undefined; // rely on default
    scopedPayload.assignedTo = undefined;
    // If a user provided a company id manually, prefer the active company to keep ownership clean
    scopedPayload.company = toObjectId(user?.activeCompany);
  } else if (!scopedPayload.company) {
    scopedPayload.company = toObjectId(user?.activeCompany);
  }

  const doc = await ServiceRequest.create(scopedPayload);
  return doc.toObject();
};

const listServiceRequests = async (user, filters = {}) => {
  const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(filters.offset, 10) || 0, 0);

  const query = buildScopedQuery(user, {});

  if (filters.serviceType && SERVICE_TYPES.includes(filters.serviceType)) {
    query.serviceType = filters.serviceType;
  }
  if (filters.status && SERVICE_STATUSES.includes(filters.status)) {
    query.status = filters.status;
  }
  if (filters.priority && SERVICE_PRIORITIES.includes(filters.priority)) {
    query.priority = filters.priority;
  }
  if (filters.companyId) {
    query.company = toObjectId(filters.companyId);
  }
  if (filters.createdBy && isAdmin(user)) {
    query.createdBy = toObjectId(filters.createdBy);
  }
  if (filters.assignedTo && isAdmin(user)) {
    query.assignedTo = toObjectId(filters.assignedTo);
  }

  const sort =
    filters.sort === 'oldest'
      ? { createdAt: 1 }
      : filters.sort === 'priority'
        ? { priority: -1, createdAt: -1 }
        : { createdAt: -1 };

  const [services, total] = await Promise.all([
    ServiceRequest.find(query).sort(sort).skip(offset).limit(limit).lean(),
    ServiceRequest.countDocuments(query)
  ]);

  return {
    services,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + services.length < total
    }
  };
};

const getServiceRequestById = async (serviceId, user) => {
  const query = buildScopedQuery(user, { _id: toObjectId(serviceId) });
  return ServiceRequest.findOne(query).lean();
};

const buildUpdatePayload = (updates, user, existingType) => {
  const allowedFieldsForUser = new Set([
    'title',
    'description',
    'priority',
    'contact',
    'location',
    'schedule',
    'budget',
    'machineRepairDetails',
    'workerDetails',
    'transportDetails',
    'notes'
  ]);

  const allowedFieldsForAdmin = new Set([
    ...allowedFieldsForUser,
    'serviceType',
    'status',
    'assignedTo',
    'company'
  ]);

  const allowed = isAdmin(user) ? allowedFieldsForAdmin : allowedFieldsForUser;
  const cleaned = {};
  Object.entries(updates || {}).forEach(([key, value]) => {
    if (allowed.has(key)) {
      cleaned[key] = value;
    }
  });

  const normalized = normalizeTypeSpecificDetails(cleaned, updates.serviceType || existingType);
  normalized.lastUpdatedBy = toObjectId(user?.id);
  return normalized;
};

const updateServiceRequest = async (serviceId, updates, user) => {
  const query = buildScopedQuery(user, { _id: toObjectId(serviceId) });
  const existing = await ServiceRequest.findOne(query);
  if (!existing) return null;

  const updatePayload = buildUpdatePayload(updates, user, existing.serviceType);
  const targetType = updatePayload.serviceType || existing.serviceType;
  const unsetPayload = buildUnsetForType(targetType);

  const updateOperations = {
    $set: { ...updatePayload, updatedAt: new Date() }
  };

  if (Object.keys(unsetPayload).length) {
    updateOperations.$unset = unsetPayload;
  }

  const updated = await ServiceRequest.findOneAndUpdate(
    { _id: existing._id },
    updateOperations,
    { new: true, runValidators: true }
  );

  return updated?.toObject() || null;
};

const updateServiceStatus = async (serviceId, status, user, notes) => {
  const query = buildScopedQuery(user, { _id: toObjectId(serviceId) });
  const payload = {
    status,
    lastUpdatedBy: toObjectId(user?.id),
    updatedAt: new Date()
  };
  if (notes) {
    payload.notes = notes;
  }

  const updated = await ServiceRequest.findOneAndUpdate(query, { $set: payload }, { new: true });
  return updated?.toObject() || null;
};

module.exports = {
  createServiceRequest,
  listServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  updateServiceStatus
};
