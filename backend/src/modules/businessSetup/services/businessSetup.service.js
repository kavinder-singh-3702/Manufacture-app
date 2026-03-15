const mongoose = require('mongoose');
const createError = require('http-errors');
const BusinessSetupRequest = require('../../../models/businessSetupRequest.model');
const ServiceRequest = require('../../../models/serviceRequest.model');
const User = require('../../../models/user.model');
const { isAdminRole } = require('../../../utils/roles');
const {
  BUSINESS_SETUP_STATUSES,
  BUSINESS_SETUP_PRIORITIES
} = require('../../../constants/businessSetup');
const {
  SERVICE_STATUSES,
  SERVICE_PRIORITIES,
  SERVICE_TYPES
} = require('../../../constants/services');
const {
  createNotification,
  createNotificationsForUsers
} = require('../../../services/notification.service');
const {
  sendBusinessSetupSubmissionEmail,
  sendBusinessSetupStatusEmail
} = require('../../../services/email.service');
const {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_ACTION_TYPES
} = require('../../../constants/notification');

const STATUS_TRANSITIONS = Object.freeze({
  new: new Set(['contacted', 'rejected', 'closed']),
  contacted: new Set(['planning', 'rejected', 'closed']),
  planning: new Set(['onboarding', 'rejected', 'closed']),
  onboarding: new Set(['launched', 'rejected', 'closed']),
  launched: new Set(['closed']),
  closed: new Set([]),
  rejected: new Set([])
});

const SERVICE_STATUS_BY_BUCKET = Object.freeze({
  open: ['pending', 'in_review', 'scheduled', 'in_progress'],
  closed: ['completed', 'cancelled'],
  rejected: []
});

const BUSINESS_STATUS_BY_BUCKET = Object.freeze({
  open: ['new', 'contacted', 'planning', 'onboarding'],
  closed: ['launched', 'closed'],
  rejected: ['rejected']
});

const PRIORITY_SCORE = Object.freeze({
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4
});

const toObjectId = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  return undefined;
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : undefined);
const toReadable = (value) =>
  normalizeString(value)
    ? normalizeString(value).replace(/_/g, ' ')
    : undefined;

const toDateOrNull = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const isValidStatusTransition = (fromStatus, toStatus) => {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true;
  const allowed = STATUS_TRANSITIONS[fromStatus];
  return Boolean(allowed && allowed.has(toStatus));
};

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

const shapeBusinessSetupRequestAdmin = (doc) => {
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
    referenceCode: plain.referenceCode,
    title: plain.title,
    businessType: plain.businessType,
    workModel: plain.workModel,
    location: plain.location,
    budgetRange: plain.budgetRange,
    startTimeline: plain.startTimeline,
    supportAreas: plain.supportAreas || [],
    founderExperience: plain.founderExperience,
    teamSize: plain.teamSize,
    preferredContactChannel: plain.preferredContactChannel,
    contactName: plain.contactName,
    contactEmail: plain.contactEmail,
    contactPhone: plain.contactPhone,
    notes: plain.notes,
    source: plain.source,
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
    metadata: plain.metadata instanceof Map ? Object.fromEntries(plain.metadata) : plain.metadata || {},
    statusHistory,
    assignmentHistory,
    internalNotes,
    timeline,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt
  };
};

const BUSINESS_SETUP_ADMIN_POPULATE = [
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

const buildAdminBusinessQuery = (filters = {}) => {
  const query = { deletedAt: { $exists: false } };

  if (filters.status && BUSINESS_SETUP_STATUSES.includes(filters.status)) {
    query.status = filters.status;
  }
  if (filters.priority && BUSINESS_SETUP_PRIORITIES.includes(filters.priority)) {
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
  if (filters.source && ['authenticated', 'guest'].includes(filters.source)) {
    query.source = filters.source;
  }
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }
  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    query.$or = [
      { title: regex },
      { businessType: regex },
      { location: regex },
      { notes: regex },
      { contactName: regex },
      { contactEmail: regex },
      { contactPhone: regex },
      { referenceCode: regex }
    ];
  }

  return query;
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

const resolvePriorityFromTimeline = (startTimeline) => {
  if (startTimeline === 'immediately') return 'urgent';
  if (startTimeline === 'within_1_month') return 'high';
  return 'normal';
};

const generateReferenceCode = () => {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BSR-${datePart}-${randomPart}`;
};

const ensureReferenceCode = async () => {
  for (let index = 0; index < 5; index += 1) {
    const code = generateReferenceCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await BusinessSetupRequest.exists({ referenceCode: code });
    if (!exists) return code;
  }
  return `BSR-${Date.now().toString(36).toUpperCase()}`;
};

const findAdminUserIds = async () => {
  const admins = await User.find({
    role: { $in: ['admin', 'super-admin'] },
    $or: [{ status: 'active' }, { status: { $exists: false } }]
  })
    .select('_id')
    .lean();

  return admins.map((item) => item._id.toString());
};

const notifyAdminsOnNewRequest = async (request) => {
  try {
    const adminUserIds = await findAdminUserIds();
    if (!adminUserIds.length) return;

    await createNotificationsForUsers({
      userIds: adminUserIds,
      title: 'New business setup request',
      body: `${request.businessType} startup assistance request received.`,
      eventKey: 'business_setup.request.created',
      topic: 'services',
      priority: NOTIFICATION_PRIORITIES.HIGH,
      data: {
        requestId: request.id,
        kind: 'business_setup',
        referenceCode: request.referenceCode,
        businessType: request.businessType,
        workModel: request.workModel
      },
      action: {
        type: NOTIFICATION_ACTION_TYPES.ROUTE,
        routeName: 'Main',
        routeParams: { screen: 'chat' },
        label: 'Open ops queue'
      },
      channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.EMAIL]
    });
  } catch (error) {
    // Notification failures must not block request creation.
    // eslint-disable-next-line no-console
    console.warn('[businessSetup] admin notification failed', error.message);
  }
};

const notifyUserAcknowledgement = async (request, user) => {
  try {
    if (!user?.id) return;

    await createNotification({
      userId: user.id,
      title: 'Business setup request submitted',
      body: `Your request ${request.referenceCode} has been received by our startup team.`,
      eventKey: 'business_setup.request.submitted',
      topic: 'services',
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      data: {
        requestId: request.id,
        referenceCode: request.referenceCode,
        kind: 'business_setup'
      },
      channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.EMAIL]
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[businessSetup] user acknowledgement notification failed', error.message);
  }
};

const notifyUserStatusChange = async ({ request, status, note, actorId }) => {
  try {
    if (!request?.createdBy) return;
    await createNotification({
      userId: String(request.createdBy),
      title: 'Business setup request updated',
      body: `Your request ${request.referenceCode} moved to ${status.replace(/_/g, ' ')}.`,
      eventKey: 'business_setup.request.status_changed',
      topic: 'services',
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      actorId,
      companyId: request.company ? String(request.company) : undefined,
      data: {
        requestId: String(request._id),
        referenceCode: request.referenceCode,
        status,
        note: note || undefined,
        kind: 'business_setup'
      },
      channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.EMAIL]
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[businessSetup] status change notification failed', error.message);
  }
};

const notifyGuestSubmissionEmail = async (request) => {
  try {
    if (request?.source !== 'guest') return;
    if (!request?.contactEmail) return;

    await sendBusinessSetupSubmissionEmail({
      to: request.contactEmail,
      contactName: request.contactName,
      referenceCode: request.referenceCode,
      businessType: request.businessType,
      workModel: toReadable(request.workModel),
      location: request.location,
      startTimeline: toReadable(request.startTimeline)
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[businessSetup] guest submission email failed', error.message);
  }
};

const notifyGuestStatusEmail = async ({ request, status, note }) => {
  try {
    if (request?.source !== 'guest') return;
    if (!request?.contactEmail) return;

    await sendBusinessSetupStatusEmail({
      to: request.contactEmail,
      contactName: request.contactName,
      referenceCode: request.referenceCode,
      status,
      note
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[businessSetup] guest status email failed', error.message);
  }
};

const shapePublicRequest = (doc) => {
  const shaped = shapeBusinessSetupRequestAdmin(doc);
  if (!shaped) return null;
  return {
    id: shaped.id,
    referenceCode: shaped.referenceCode,
    title: shaped.title,
    businessType: shaped.businessType,
    workModel: shaped.workModel,
    location: shaped.location,
    budgetRange: shaped.budgetRange,
    startTimeline: shaped.startTimeline,
    supportAreas: shaped.supportAreas,
    founderExperience: shaped.founderExperience,
    teamSize: shaped.teamSize,
    preferredContactChannel: shaped.preferredContactChannel,
    contactName: shaped.contactName,
    contactEmail: shaped.contactEmail,
    contactPhone: shaped.contactPhone,
    notes: shaped.notes,
    status: shaped.status,
    priority: shaped.priority,
    source: shaped.source,
    createdAt: shaped.createdAt,
    updatedAt: shaped.updatedAt
  };
};

const createBusinessSetupRequest = async (payload, user) => {
  const isAuthenticated = Boolean(user?.id);
  const source = isAuthenticated ? 'authenticated' : 'guest';

  const contactName = normalizeString(payload.contactName) || normalizeString(user?.displayName);
  const contactEmail = normalizeString(payload.contactEmail) || normalizeString(user?.email);
  const contactPhone = normalizeString(payload.contactPhone);

  if (!isAuthenticated) {
    if (!contactName) {
      throw createError(400, 'contactName is required for guest submissions');
    }
    if (!contactEmail && !contactPhone) {
      throw createError(400, 'Provide at least one contact method (email or phone)');
    }
  }

  const startTimeline = normalizeString(payload.startTimeline);
  const referenceCode = await ensureReferenceCode();

  const scopedPayload = {
    referenceCode,
    title: normalizeString(payload.title) || `Start ${normalizeString(payload.businessType) || 'new business'}`,
    businessType: normalizeString(payload.businessType),
    workModel: normalizeString(payload.workModel),
    location: normalizeString(payload.location),
    budgetRange: normalizeString(payload.budgetRange),
    startTimeline,
    supportAreas: Array.isArray(payload.supportAreas)
      ? payload.supportAreas.map((item) => normalizeString(item)).filter(Boolean)
      : [],
    founderExperience: normalizeString(payload.founderExperience),
    teamSize: Number.isFinite(Number(payload.teamSize)) ? Number(payload.teamSize) : undefined,
    preferredContactChannel: normalizeString(payload.preferredContactChannel) || 'phone',
    contactName,
    contactEmail,
    contactPhone,
    notes: normalizeString(payload.notes),
    source,
    status: 'new',
    priority: resolvePriorityFromTimeline(startTimeline),
    company: toObjectId(user?.activeCompany),
    createdBy: toObjectId(user?.id),
    createdByRole: isAuthenticated ? (isAdminRole(user.role) ? 'admin' : 'user') : 'guest',
    lastUpdatedBy: toObjectId(user?.id),
    lastActionAt: new Date(),
    statusHistory: [
      {
        from: undefined,
        to: 'new',
        at: new Date(),
        by: toObjectId(user?.id),
        reason: 'Request created'
      }
    ]
  };

  const created = await BusinessSetupRequest.create(scopedPayload);
  const shaped = shapePublicRequest(created);

  await Promise.all([
    notifyAdminsOnNewRequest(shaped),
    notifyUserAcknowledgement(shaped, user),
    notifyGuestSubmissionEmail(shaped)
  ]);

  return shaped;
};

const listBusinessSetupRequestsForUser = async (user, filters = {}) => {
  const userId = toObjectId(user?.id);
  if (!userId) {
    throw createError(401, 'Authentication required');
  }

  const limit = clamp(parseNumber(filters.limit, 20), 1, 100);
  const offset = Math.max(parseNumber(filters.offset, 0), 0);

  const query = {
    deletedAt: { $exists: false },
    createdBy: userId
  };

  if (filters.status && BUSINESS_SETUP_STATUSES.includes(filters.status)) {
    query.status = filters.status;
  }

  const sort = filters.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    BusinessSetupRequest.find(query).sort(sort).skip(offset).limit(limit).lean(),
    BusinessSetupRequest.countDocuments(query)
  ]);

  return {
    requests: items.map(shapePublicRequest),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total
    }
  };
};

const listBusinessSetupRequestsAdmin = async (filters = {}) => {
  const limit = clamp(parseNumber(filters.limit, 30), 1, 100);
  const offset = Math.max(parseNumber(filters.offset, 0), 0);
  const query = buildAdminBusinessQuery(filters);

  const [items, total] = await Promise.all([
    BusinessSetupRequest.find(query)
      .sort(resolveAdminSort(filters.sort))
      .skip(offset)
      .limit(limit)
      .populate(BUSINESS_SETUP_ADMIN_POPULATE)
      .lean(),
    BusinessSetupRequest.countDocuments(query)
  ]);

  return {
    requests: items.map(shapeBusinessSetupRequestAdmin),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total
    }
  };
};

const getBusinessSetupRequestAdminById = async (requestId) => {
  const objectId = toObjectId(requestId);
  if (!objectId) return null;

  const request = await BusinessSetupRequest.findOne({
    _id: objectId,
    deletedAt: { $exists: false }
  }).populate(BUSINESS_SETUP_ADMIN_POPULATE);

  if (!request) return null;
  return shapeBusinessSetupRequestAdmin(request);
};

const ensureAdminContextScope = ({ actorRole, contextCompanyId, requestCompanyId }) => {
  if (actorRole === 'super-admin') {
    if (
      contextCompanyId &&
      requestCompanyId &&
      String(contextCompanyId) !== String(requestCompanyId)
    ) {
      throw createError(400, 'contextCompanyId must match the target request company');
    }
    return;
  }

  if (!contextCompanyId) {
    throw createError(400, 'contextCompanyId is required for admin workflow mutations');
  }

  if (requestCompanyId && String(contextCompanyId) !== String(requestCompanyId)) {
    throw createError(400, 'contextCompanyId must match the target request company');
  }
};

const assertExpectedUpdatedAt = (existing, expectedUpdatedAt) => {
  if (!expectedUpdatedAt) return;
  const expected = new Date(expectedUpdatedAt);
  if (Number.isNaN(expected.getTime())) {
    throw createError(400, 'expectedUpdatedAt must be a valid ISO datetime');
  }
  if (new Date(existing.updatedAt).getTime() !== expected.getTime()) {
    throw createError(409, 'Request has changed. Refresh and retry with latest data.');
  }
};

const updateBusinessSetupRequestWorkflowAdmin = async ({
  requestId,
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
  const requestObjectId = toObjectId(requestId);
  if (!requestObjectId) throw createError(400, 'Invalid requestId');

  const actorObjectId = toObjectId(actorId);
  const request = await BusinessSetupRequest.findOne({
    _id: requestObjectId,
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
  let statusChanged = false;

  if (status !== undefined && status !== request.status) {
    if (!BUSINESS_SETUP_STATUSES.includes(status)) {
      throw createError(400, 'Unsupported status');
    }
    if (!isValidStatusTransition(request.status, status)) {
      throw createError(400, `Invalid status transition from "${request.status}" to "${status}"`);
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
    if (!request.firstResponseAt && status !== 'new') {
      request.firstResponseAt = now;
    }
    if (status === 'launched' || status === 'closed' || status === 'rejected') {
      request.resolvedAt = now;
    } else {
      request.resolvedAt = undefined;
    }
    changed = true;
    statusChanged = true;
  }

  if (priority !== undefined && priority !== request.priority) {
    if (!BUSINESS_SETUP_PRIORITIES.includes(priority)) {
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
    return getBusinessSetupRequestAdminById(requestId);
  }

  request.lastUpdatedBy = actorObjectId;
  request.lastActionAt = now;
  await request.save();

  if (statusChanged) {
    await Promise.all([
      notifyUserStatusChange({
        request,
        status: request.status,
        note: trimmedNote,
        actorId: actorId || undefined
      }),
      notifyGuestStatusEmail({
        request,
        status: request.status,
        note: trimmedNote
      })
    ]);
  }

  return getBusinessSetupRequestAdminById(requestId);
};

const buildServiceOpsQuery = (filters = {}) => {
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
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }
  if (filters.statusBucket && SERVICE_STATUS_BY_BUCKET[filters.statusBucket]) {
    const statuses = SERVICE_STATUS_BY_BUCKET[filters.statusBucket];
    if (!statuses.length) {
      query.status = { $in: [] };
    } else {
      query.status = { $in: statuses };
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

const buildBusinessOpsQuery = (filters = {}) => {
  const query = buildAdminBusinessQuery(filters);

  if (filters.statusBucket && BUSINESS_STATUS_BY_BUCKET[filters.statusBucket]) {
    query.status = { $in: BUSINESS_STATUS_BY_BUCKET[filters.statusBucket] };
  }

  return query;
};

const normalizeOpsItem = (item) => {
  if (item.kind === 'service') {
    return {
      id: String(item._id),
      kind: 'service',
      title: item.title,
      status: item.status,
      priority: item.priority,
      company: shapeCompanySummary(item.company),
      createdBy: shapeUserSummary(item.createdBy),
      assignedTo: shapeUserSummary(item.assignedTo),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      serviceType: item.serviceType,
      preview: {
        serviceType: item.serviceType,
        description: item.description || undefined
      }
    };
  }

  return {
    id: String(item._id),
    kind: 'business_setup',
    title: item.title,
    status: item.status,
    priority: item.priority,
    company: shapeCompanySummary(item.company),
    createdBy: shapeUserSummary(item.createdBy),
    assignedTo: shapeUserSummary(item.assignedTo),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    referenceCode: item.referenceCode,
    preview: {
      businessType: item.businessType,
      workModel: item.workModel,
      location: item.location,
      budgetRange: item.budgetRange,
      startTimeline: item.startTimeline,
      source: item.source
    }
  };
};

const compareOpsItems = (left, right, sort) => {
  if (sort === 'createdAt:asc') {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  }
  if (sort === 'createdAt:desc') {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  }
  if (sort === 'updatedAt:asc') {
    return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
  }
  if (sort === 'priority:desc') {
    const priorityDiff = (PRIORITY_SCORE[right.priority] || 0) - (PRIORITY_SCORE[left.priority] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  }

  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
};

const listOpsRequestsAdmin = async (filters = {}) => {
  const limit = clamp(parseNumber(filters.limit, 30), 1, 100);
  const offset = Math.max(parseNumber(filters.offset, 0), 0);
  const kind = ['service', 'business_setup'].includes(filters.kind) ? filters.kind : 'all';
  const sort = ['createdAt:asc', 'createdAt:desc', 'updatedAt:asc', 'updatedAt:desc', 'priority:desc'].includes(filters.sort)
    ? filters.sort
    : 'updatedAt:desc';

  const fetchWindow = clamp(offset + limit + 80, 80, 500);

  const shouldIncludeService = kind === 'all' || kind === 'service';
  const shouldIncludeBusiness = kind === 'all' || kind === 'business_setup';

  const serviceQuery = shouldIncludeService ? buildServiceOpsQuery(filters) : null;
  const businessQuery = shouldIncludeBusiness ? buildBusinessOpsQuery(filters) : null;

  const [serviceRows, serviceTotal, businessRows, businessTotal] = await Promise.all([
    shouldIncludeService
      ? ServiceRequest.find(serviceQuery)
          .sort(resolveAdminSort(sort))
          .limit(fetchWindow)
          .select('title description status priority company createdBy assignedTo updatedAt createdAt serviceType')
          .populate('company', 'displayName status type complianceStatus')
          .populate('createdBy', 'displayName email role')
          .populate('assignedTo', 'displayName email role')
          .lean()
      : Promise.resolve([]),
    shouldIncludeService ? ServiceRequest.countDocuments(serviceQuery) : Promise.resolve(0),
    shouldIncludeBusiness
      ? BusinessSetupRequest.find(businessQuery)
          .sort(resolveAdminSort(sort))
          .limit(fetchWindow)
          .select(
            'referenceCode title businessType workModel location budgetRange startTimeline source status priority company createdBy assignedTo updatedAt createdAt'
          )
          .populate('company', 'displayName status type complianceStatus')
          .populate('createdBy', 'displayName email role')
          .populate('assignedTo', 'displayName email role')
          .lean()
      : Promise.resolve([]),
    shouldIncludeBusiness ? BusinessSetupRequest.countDocuments(businessQuery) : Promise.resolve(0)
  ]);

  const normalized = [
    ...serviceRows.map((item) => normalizeOpsItem({ ...item, kind: 'service' })),
    ...businessRows.map((item) => normalizeOpsItem({ ...item, kind: 'business_setup' }))
  ];

  normalized.sort((left, right) => compareOpsItems(left, right, sort));

  const pageItems = normalized.slice(offset, offset + limit);
  const total = serviceTotal + businessTotal;

  return {
    requests: pageItems,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + pageItems.length < total
    }
  };
};

module.exports = {
  createBusinessSetupRequest,
  listBusinessSetupRequestsForUser,
  listBusinessSetupRequestsAdmin,
  getBusinessSetupRequestAdminById,
  updateBusinessSetupRequestWorkflowAdmin,
  listOpsRequestsAdmin
};
