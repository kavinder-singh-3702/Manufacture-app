const mongoose = require('mongoose');
const createError = require('http-errors');
const ServiceRequest = require('../../../models/serviceRequest.model');
const { isAdminRole } = require('../../../utils/roles');
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

const isAdmin = (user) => isAdminRole(user?.role);

const STATUS_TRANSITIONS = Object.freeze({
  pending: new Set(['in_review', 'scheduled', 'in_progress', 'completed', 'cancelled']),
  in_review: new Set(['scheduled', 'in_progress', 'completed', 'cancelled']),
  scheduled: new Set(['in_progress', 'completed', 'cancelled']),
  in_progress: new Set(['completed', 'cancelled']),
  completed: new Set([]),
  cancelled: new Set([])
});

const ADMIN_SERVICE_POPULATE = [
  { path: 'company', select: 'displayName status type complianceStatus' },
  { path: 'createdBy', select: 'displayName email role' },
  { path: 'assignedTo', select: 'displayName email role' },
  { path: 'lastUpdatedBy', select: 'displayName email role' },
  { path: 'statusHistory.by', select: 'displayName email role' },
  { path: 'assignmentHistory.by', select: 'displayName email role' },
  { path: 'assignmentHistory.assignedTo', select: 'displayName email role' },
  { path: 'assignmentHistory.unassignedFrom', select: 'displayName email role' },
  { path: 'internalNotes.by', select: 'displayName email role' }
];

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toDateOrNull = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : undefined);

const shapeUserSummary = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId || typeof value === 'string') {
    return { id: value.toString() };
  }
  return {
    id: value._id?.toString?.() || value.id?.toString?.(),
    displayName: value.displayName,
    email: value.email,
    role: value.role
  };
};

const shapeCompanySummary = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId || typeof value === 'string') {
    return { id: value.toString() };
  }
  return {
    id: value._id?.toString?.() || value.id?.toString?.(),
    displayName: value.displayName,
    status: value.status,
    type: value.type,
    complianceStatus: value.complianceStatus
  };
};

const toPlain = (doc) => {
  if (!doc) return null;
  return typeof doc.toObject === 'function' ? doc.toObject({ versionKey: false }) : doc;
};

const shapeServiceRequestAdmin = (doc) => {
  const plain = toPlain(doc);
  if (!plain) return null;

  const statusHistory = (plain.statusHistory || []).map((entry) => ({
    from: entry.from,
    to: entry.to,
    at: entry.at,
    by: shapeUserSummary(entry.by),
    reason: entry.reason,
    note: entry.note
  }));

  const assignmentHistory = (plain.assignmentHistory || []).map((entry) => ({
    assignedTo: shapeUserSummary(entry.assignedTo),
    unassignedFrom: shapeUserSummary(entry.unassignedFrom),
    at: entry.at,
    by: shapeUserSummary(entry.by),
    reason: entry.reason
  }));

  const internalNotes = (plain.internalNotes || []).map((entry) => ({
    id: entry._id?.toString?.() || entry.id,
    message: entry.message,
    kind: entry.kind,
    reason: entry.reason,
    by: shapeUserSummary(entry.by),
    at: entry.at
  }));

  const timeline = [
    ...statusHistory.map((entry) => ({ type: 'status', at: entry.at, entry })),
    ...assignmentHistory.map((entry) => ({ type: 'assignment', at: entry.at, entry })),
    ...internalNotes.map((entry) => ({ type: 'note', at: entry.at, entry }))
  ].sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());

  return {
    id: plain._id?.toString?.() || plain.id,
    serviceType: plain.serviceType,
    title: plain.title,
    description: plain.description,
    status: plain.status,
    priority: plain.priority,
    company: shapeCompanySummary(plain.company),
    createdBy: shapeUserSummary(plain.createdBy),
    createdByRole: plain.createdByRole,
    assignedTo: shapeUserSummary(plain.assignedTo),
    lastUpdatedBy: shapeUserSummary(plain.lastUpdatedBy),
    slaDueAt: plain.slaDueAt,
    firstResponseAt: plain.firstResponseAt,
    resolvedAt: plain.resolvedAt,
    lastActionAt: plain.lastActionAt,
    contact: plain.contact,
    location: plain.location,
    schedule: plain.schedule,
    budget: plain.budget,
    machineRepairDetails: plain.machineRepairDetails,
    workerDetails: plain.workerDetails,
    transportDetails: plain.transportDetails,
    notes: plain.notes,
    metadata: plain.metadata instanceof Map ? Object.fromEntries(plain.metadata) : plain.metadata || {},
    statusHistory,
    assignmentHistory,
    internalNotes,
    timeline,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt
  };
};

const resolveAdminSort = (sortValue) => {
  switch (sortValue) {
    case 'createdAt:asc':
      return { createdAt: 1 };
    case 'updatedAt:asc':
      return { updatedAt: 1 };
    case 'updatedAt:desc':
      return { updatedAt: -1 };
    case 'priority:desc':
      return { priority: -1, updatedAt: -1 };
    case 'slaDueAt:asc':
      return { slaDueAt: 1, updatedAt: -1 };
    case 'createdAt:desc':
    default:
      return { createdAt: -1 };
  }
};

const isValidStatusTransition = (fromStatus, toStatus) => {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true;
  const allowed = STATUS_TRANSITIONS[fromStatus];
  return Boolean(allowed && allowed.has(toStatus));
};

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
  scopedPayload.lastActionAt = new Date();

  if (!isAdmin(user)) {
    scopedPayload.status = undefined; // rely on default
    scopedPayload.assignedTo = undefined;
    // If a user provided a company id manually, prefer the active company to keep ownership clean
    scopedPayload.company = toObjectId(user?.activeCompany);
  } else if (!scopedPayload.company) {
    scopedPayload.company = toObjectId(user?.activeCompany);
  }

  const initialStatus = scopedPayload.status && SERVICE_STATUSES.includes(scopedPayload.status)
    ? scopedPayload.status
    : 'pending';

  scopedPayload.statusHistory = [
    {
      from: undefined,
      to: initialStatus,
      at: new Date(),
      by: toObjectId(user?.id),
      reason: 'Request created'
    }
  ];

  if (initialStatus !== 'pending') {
    scopedPayload.firstResponseAt = new Date();
  }
  if (initialStatus === 'completed' || initialStatus === 'cancelled') {
    scopedPayload.resolvedAt = new Date();
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
  const now = new Date();
  const targetType = updatePayload.serviceType || existing.serviceType;
  const unsetPayload = buildUnsetForType(targetType);
  const statusChanged = updatePayload.status && updatePayload.status !== existing.status;

  if (statusChanged && !isValidStatusTransition(existing.status, updatePayload.status)) {
    throw createError(400, `Invalid service status transition from "${existing.status}" to "${updatePayload.status}"`);
  }

  const updateOperations = {
    $set: { ...updatePayload, updatedAt: now, lastActionAt: now }
  };

  if (Object.keys(unsetPayload).length) {
    updateOperations.$unset = unsetPayload;
  }

  if (statusChanged) {
    updateOperations.$push = {
      ...(updateOperations.$push || {}),
      statusHistory: {
        from: existing.status,
        to: updatePayload.status,
        at: now,
        by: toObjectId(user?.id),
        reason: 'Status changed via update endpoint'
      }
    };
    if (!existing.firstResponseAt && updatePayload.status !== 'pending') {
      updateOperations.$set.firstResponseAt = now;
    }
    if (updatePayload.status === 'completed' || updatePayload.status === 'cancelled') {
      updateOperations.$set.resolvedAt = now;
    } else {
      updateOperations.$unset = { ...(updateOperations.$unset || {}), resolvedAt: '' };
    }
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
  const existing = await ServiceRequest.findOne(query);
  if (!existing) return null;

  if (!isValidStatusTransition(existing.status, status)) {
    throw createError(400, `Invalid service status transition from "${existing.status}" to "${status}"`);
  }

  const now = new Date();
  const actorId = toObjectId(user?.id);
  const trimmedNotes = normalizeString(notes);

  const updatePayload = {
    status,
    lastUpdatedBy: actorId,
    lastActionAt: now,
    updatedAt: now
  };

  if (!existing.firstResponseAt && status !== 'pending') {
    updatePayload.firstResponseAt = now;
  }
  if (status === 'completed' || status === 'cancelled') {
    updatePayload.resolvedAt = now;
  } else {
    updatePayload.resolvedAt = undefined;
  }
  if (trimmedNotes) {
    updatePayload.notes = trimmedNotes;
  }

  const updateOperations = {
    $set: updatePayload,
    $push: {
      statusHistory: {
        from: existing.status,
        to: status,
        at: now,
        by: actorId,
        note: trimmedNotes,
        reason: 'Status changed via status endpoint'
      }
    }
  };

  if (updatePayload.resolvedAt === undefined) {
    updateOperations.$unset = { resolvedAt: '' };
    delete updateOperations.$set.resolvedAt;
  }

  const updated = await ServiceRequest.findOneAndUpdate(
    { _id: existing._id, deletedAt: { $exists: false } },
    updateOperations,
    { new: true }
  );
  return updated?.toObject() || null;
};

const buildAdminServiceQuery = (filters = {}) => {
  const query = { deletedAt: { $exists: false } };

  if (filters.serviceType && SERVICE_TYPES.includes(filters.serviceType)) {
    query.serviceType = filters.serviceType;
  }
  if (filters.status && SERVICE_STATUSES.includes(filters.status)) {
    query.status = filters.status;
  }
  if (filters.priority && SERVICE_PRIORITIES.includes(filters.priority)) {
    query.priority = filters.priority;
  }
  if (filters.companyId && toObjectId(filters.companyId)) {
    query.company = toObjectId(filters.companyId);
  }
  if (filters.createdBy && toObjectId(filters.createdBy)) {
    query.createdBy = toObjectId(filters.createdBy);
  }
  if (filters.assignedTo && toObjectId(filters.assignedTo)) {
    query.assignedTo = toObjectId(filters.assignedTo);
  }
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) {
      query.createdAt.$gte = new Date(filters.from);
    }
    if (filters.to) {
      query.createdAt.$lte = new Date(filters.to);
    }
  }
  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    query.$or = [
      { title: regex },
      { description: regex },
      { notes: regex },
      { 'contact.name': regex },
      { 'contact.email': regex },
      { 'contact.phone': regex }
    ];
  }

  return query;
};

const listServiceRequestsAdmin = async (filters = {}) => {
  const limit = clamp(parseNumber(filters.limit, 30), 1, 100);
  const offset = Math.max(parseNumber(filters.offset, 0), 0);
  const query = buildAdminServiceQuery(filters);

  const [items, total] = await Promise.all([
    ServiceRequest.find(query)
      .sort(resolveAdminSort(filters.sort))
      .skip(offset)
      .limit(limit)
      .populate(ADMIN_SERVICE_POPULATE)
      .lean(),
    ServiceRequest.countDocuments(query)
  ]);

  return {
    requests: items.map(shapeServiceRequestAdmin),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total
    }
  };
};

const getServiceRequestAdminById = async (serviceRequestId) => {
  const requestId = toObjectId(serviceRequestId);
  if (!requestId) return null;

  const request = await ServiceRequest.findOne({
    _id: requestId,
    deletedAt: { $exists: false }
  }).populate(ADMIN_SERVICE_POPULATE);

  if (!request) return null;
  return shapeServiceRequestAdmin(request);
};

const ensureAdminContextScope = ({ actorRole, contextCompanyId, requestCompanyId }) => {
  if (actorRole === 'super-admin') {
    if (
      contextCompanyId &&
      requestCompanyId &&
      String(contextCompanyId) !== String(requestCompanyId)
    ) {
      throw createError(400, 'contextCompanyId must match the target service request company');
    }
    return;
  }

  if (!contextCompanyId) {
    throw createError(400, 'contextCompanyId is required for admin workflow mutations');
  }

  if (requestCompanyId && String(contextCompanyId) !== String(requestCompanyId)) {
    throw createError(400, 'contextCompanyId must match the target service request company');
  }
};

const assertExpectedUpdatedAt = (existing, expectedUpdatedAt) => {
  if (!expectedUpdatedAt) return;
  const expected = new Date(expectedUpdatedAt);
  if (Number.isNaN(expected.getTime())) {
    throw createError(400, 'expectedUpdatedAt must be a valid ISO datetime');
  }
  if (new Date(existing.updatedAt).getTime() !== expected.getTime()) {
    throw createError(409, 'Service request has changed. Refresh and retry with latest data.');
  }
};

const updateServiceRequestWorkflowAdmin = async ({
  serviceRequestId,
  actorId,
  actorRole,
  contextCompanyId,
  status,
  priority,
  assignedTo,
  slaDueAt,
  note,
  reason,
  expectedUpdatedAt
}) => {
  const requestId = toObjectId(serviceRequestId);
  if (!requestId) {
    throw createError(400, 'Invalid serviceRequestId');
  }

  const actorObjectId = toObjectId(actorId);
  const request = await ServiceRequest.findOne({
    _id: requestId,
    deletedAt: { $exists: false }
  });

  if (!request) return null;

  ensureAdminContextScope({
    actorRole,
    contextCompanyId: toObjectId(contextCompanyId),
    requestCompanyId: request.company
  });
  assertExpectedUpdatedAt(request, expectedUpdatedAt);

  const now = new Date();
  const trimmedNote = normalizeString(note);
  const trimmedReason = normalizeString(reason);
  let changed = false;

  if (status !== undefined && status !== request.status) {
    if (!SERVICE_STATUSES.includes(status)) {
      throw createError(400, 'Unsupported status');
    }
    if (!isValidStatusTransition(request.status, status)) {
      throw createError(400, `Invalid service status transition from "${request.status}" to "${status}"`);
    }
    request.statusHistory.push({
      from: request.status,
      to: status,
      at: now,
      by: actorObjectId,
      reason: trimmedReason,
      note: trimmedNote
    });
    request.status = status;
    if (!request.firstResponseAt && status !== 'pending') {
      request.firstResponseAt = now;
    }
    if (status === 'completed' || status === 'cancelled') {
      request.resolvedAt = now;
    } else {
      request.resolvedAt = undefined;
    }
    changed = true;
  }

  if (priority !== undefined && priority !== request.priority) {
    if (!SERVICE_PRIORITIES.includes(priority)) {
      throw createError(400, 'Unsupported priority');
    }
    request.priority = priority;
    changed = true;
  }

  if (slaDueAt !== undefined) {
    const parsedSla = toDateOrNull(slaDueAt);
    if (parsedSla === undefined && slaDueAt !== undefined) {
      throw createError(400, 'slaDueAt must be a valid ISO datetime or null');
    }
    request.slaDueAt = parsedSla || undefined;
    changed = true;
  }

  if (assignedTo !== undefined) {
    const nextAssignee = toObjectId(assignedTo);
    const previousAssignee = request.assignedTo ? String(request.assignedTo) : null;
    const nextAssigneeId = nextAssignee ? String(nextAssignee) : null;
    if (previousAssignee !== nextAssigneeId) {
      request.assignmentHistory.push({
        assignedTo: nextAssignee || undefined,
        unassignedFrom: request.assignedTo || undefined,
        at: now,
        by: actorObjectId,
        reason: trimmedReason
      });
      request.assignedTo = nextAssignee || undefined;
      changed = true;
    }
  }

  if (trimmedNote) {
    request.internalNotes.push({
      message: trimmedNote,
      kind: 'workflow',
      reason: trimmedReason,
      by: actorObjectId,
      at: now
    });
    changed = true;
  }

  if (!changed) {
    return getServiceRequestAdminById(serviceRequestId);
  }

  request.lastUpdatedBy = actorObjectId;
  request.lastActionAt = now;
  await request.save();
  return getServiceRequestAdminById(serviceRequestId);
};

const updateServiceRequestContentAdmin = async ({
  serviceRequestId,
  actorId,
  actorRole,
  contextCompanyId,
  updates,
  reason,
  expectedUpdatedAt
}) => {
  const requestId = toObjectId(serviceRequestId);
  if (!requestId) {
    throw createError(400, 'Invalid serviceRequestId');
  }

  const actorObjectId = toObjectId(actorId);
  const request = await ServiceRequest.findOne({
    _id: requestId,
    deletedAt: { $exists: false }
  });

  if (!request) return null;

  ensureAdminContextScope({
    actorRole,
    contextCompanyId: toObjectId(contextCompanyId),
    requestCompanyId: request.company
  });
  assertExpectedUpdatedAt(request, expectedUpdatedAt);

  const allowedFields = new Set([
    'title',
    'description',
    'contact',
    'location',
    'schedule',
    'budget',
    'machineRepairDetails',
    'workerDetails',
    'transportDetails',
    'metadata'
  ]);

  const sanitizedUpdates = {};
  Object.entries(updates || {}).forEach(([key, value]) => {
    if (allowedFields.has(key)) {
      sanitizedUpdates[key] = value;
    }
  });

  if (!Object.keys(sanitizedUpdates).length) {
    throw createError(400, 'No editable content fields provided');
  }

  const normalized = normalizeTypeSpecificDetails(sanitizedUpdates, request.serviceType);
  Object.entries(normalized).forEach(([key, value]) => {
    request[key] = value;
  });

  const now = new Date();
  request.internalNotes.push({
    message: `Content updated: ${Object.keys(normalized).join(', ')}`,
    kind: 'content',
    reason: normalizeString(reason) || 'content-correction',
    by: actorObjectId,
    at: now
  });
  request.lastUpdatedBy = actorObjectId;
  request.lastActionAt = now;

  await request.save();
  return getServiceRequestAdminById(serviceRequestId);
};

module.exports = {
  createServiceRequest,
  listServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  updateServiceStatus,
  listServiceRequestsAdmin,
  getServiceRequestAdminById,
  updateServiceRequestWorkflowAdmin,
  updateServiceRequestContentAdmin
};
