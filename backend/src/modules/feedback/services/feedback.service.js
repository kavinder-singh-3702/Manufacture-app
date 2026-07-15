const createError = require('http-errors');
const Feedback = require('../../../models/feedback.model');
const User = require('../../../models/user.model');
const { createNotificationsForUsers } = require('../../../services/notification.service');
const {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_ACTION_TYPES,
} = require('../../../constants/notification');

const PLATFORM_OPTIONS = new Set(['ios', 'android', 'web', 'unknown']);

// Per-user submit throttle. Prevents a single authenticated user from
// spamming POST /feedback and amplifying into an admin-notification storm
// (each submit fans out to every admin). In-memory / single-process; sized
// small to avoid unbounded growth. If the org runs multi-process, move to
// Redis. For v1.0 single-node deployment this is enough.
const SUBMIT_MIN_INTERVAL_MS = 15_000;
const submitTimestamps = new Map();
const SUBMIT_HISTORY_MAX = 5000;

const throttleSubmit = (userId) => {
  const key = String(userId);
  const now = Date.now();
  const last = submitTimestamps.get(key);
  if (last && now - last < SUBMIT_MIN_INTERVAL_MS) {
    const wait = Math.ceil((SUBMIT_MIN_INTERVAL_MS - (now - last)) / 1000);
    throw createError(429, `Please wait ${wait}s before sending more feedback.`);
  }
  submitTimestamps.set(key, now);
  if (submitTimestamps.size > SUBMIT_HISTORY_MAX) {
    // Evict oldest half. Cheap and bounds memory.
    const cutoff = now - SUBMIT_MIN_INTERVAL_MS;
    for (const [k, t] of submitTimestamps) {
      if (t < cutoff) submitTimestamps.delete(k);
    }
  }
};

const shapeFeedback = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject({ versionKey: false }) : doc;
  return {
    id: plain._id?.toString?.() || plain.id,
    user: plain.user?.toString?.() || plain.user,
    subject: plain.subject || '',
    message: plain.message,
    rating: typeof plain.rating === 'number' ? plain.rating : null,
    appVersion: plain.appVersion,
    platform: plain.platform,
    resolvedAt: plain.resolvedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

const findAdminUserIds = async () => {
  const admins = await User.find({
    role: { $in: ['admin', 'super-admin'] },
    $or: [{ status: 'active' }, { status: { $exists: false } }],
  })
    .select('_id')
    .lean();
  return admins.map((item) => item._id.toString());
};

const truncate = (value, max = 80) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
};

const notifyAdminsOnNewFeedback = async ({ feedback, submitter }) => {
  try {
    const adminUserIds = await findAdminUserIds();
    if (!adminUserIds.length) return;

    // Never surface the submitter's email in the notification body — push
    // payloads land on APNs/FCM lockscreens and get mirrored to watches
    // and logs. Use displayName only, fall back to a generic label.
    const submitterLabel = submitter?.displayName?.trim() || 'A user';
    const preview = feedback.subject?.trim() || truncate(feedback.message, 80);
    const rating = typeof feedback.rating === 'number' ? feedback.rating : null;

    await createNotificationsForUsers({
      userIds: adminUserIds,
      title: 'New user feedback',
      body: rating
        ? `${submitterLabel} left feedback (${rating}★): "${preview}"`
        : `${submitterLabel} left feedback: "${preview}"`,
      eventKey: 'feedback.submitted',
      topic: 'feedback',
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      actorId: submitter?._id || submitter?.id,
      data: {
        feedbackId: feedback._id?.toString?.() || feedback.id,
        rating,
        submitterId: submitter?._id?.toString?.() || submitter?.id?.toString?.() || null,
        submitterName: submitterLabel,
      },
      // Route admins to the general Notifications screen. Full feedback body
      // and rating are in `data`; a dedicated admin inbox is v1.0.1 scope.
      action: {
        type: NOTIFICATION_ACTION_TYPES.ROUTE,
        routeName: 'Notifications',
        label: 'Open notifications',
      },
      channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH],
    });
  } catch (error) {
    // Notification failures must not block feedback submission.
    // eslint-disable-next-line no-console
    console.warn('[feedback] admin notification failed', error.message);
  }
};

const submitFeedback = async ({ userId, payload }) => {
  if (!userId) {
    throw createError(401, 'Sign in to send feedback');
  }

  // Throttle first — cheapest path, blunts spam before we do any DB work.
  throttleSubmit(userId);

  const rawMessage = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (!rawMessage) {
    throw createError(400, 'Feedback message is required');
  }
  if (rawMessage.length > 2000) {
    throw createError(400, 'Feedback message must be 2000 characters or fewer');
  }

  const rawSubject = typeof payload?.subject === 'string' ? payload.subject.trim() : '';
  if (rawSubject.length > 120) {
    throw createError(400, 'Subject must be 120 characters or fewer');
  }

  let rating = null;
  if (payload?.rating !== undefined && payload?.rating !== null) {
    // Reject non-number types up-front so `Number(true)`/`Number([3])` etc.
    // can't slip through with a coerced 1 or 3. Only accept a native
    // integer 1..5.
    if (typeof payload.rating !== 'number' || !Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
      throw createError(400, 'Rating must be an integer between 1 and 5');
    }
    rating = payload.rating;
  }

  const rawPlatform = typeof payload?.platform === 'string' ? payload.platform.toLowerCase() : 'unknown';
  const platform = PLATFORM_OPTIONS.has(rawPlatform) ? rawPlatform : 'unknown';

  const rawVersion = typeof payload?.appVersion === 'string' ? payload.appVersion.trim().slice(0, 40) : undefined;

  const feedback = await Feedback.create({
    user: userId,
    subject: rawSubject,
    message: rawMessage,
    rating,
    platform,
    appVersion: rawVersion,
  });

  const submitter = await User.findById(userId).select('displayName email').lean();
  await notifyAdminsOnNewFeedback({ feedback, submitter });

  return shapeFeedback(feedback);
};

const shapeFeedbackWithUser = (doc) => {
  if (!doc) return null;
  const shaped = shapeFeedback(doc);
  const populatedUser = doc.user && typeof doc.user === 'object' && doc.user._id
    ? {
      id: doc.user._id.toString(),
      displayName: doc.user.displayName,
      email: doc.user.email,
    }
    : null;
  return {
    ...shaped,
    user: populatedUser || shaped.user,
    status: shaped.resolvedAt ? 'resolved' : 'new',
  };
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const listFeedback = async ({ status, limit = 50, offset = 0 } = {}) => {
  const safeLimit = clamp(Number.isFinite(Number(limit)) ? Number(limit) : 50, 1, 100);
  const safeOffset = Math.max(Number.isFinite(Number(offset)) ? Number(offset) : 0, 0);

  const filter = {};
  if (status === 'new') {
    filter.$or = [{ resolvedAt: { $exists: false } }, { resolvedAt: null }];
  } else if (status === 'resolved') {
    filter.resolvedAt = { $ne: null };
  }

  const [items, total] = await Promise.all([
    Feedback.find(filter)
      .populate({ path: 'user', select: 'displayName email' })
      .sort({ createdAt: -1 })
      .skip(safeOffset)
      .limit(safeLimit)
      .lean(),
    Feedback.countDocuments(filter),
  ]);

  return {
    feedback: items.map(shapeFeedbackWithUser),
    pagination: {
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + items.length < total,
    },
  };
};

const setFeedbackResolved = async ({ feedbackId, resolved }) => {
  if (!feedbackId || !/^[a-fA-F0-9]{24}$/.test(String(feedbackId))) {
    throw createError(400, 'Invalid feedback id');
  }

  // Atomic conditional update — avoids the read-modify-write race between
  // two concurrent PATCHes. Also preserves the ORIGINAL resolvedAt on a
  // duplicate `resolved:true` (only writes when previously null/absent), so
  // "time to close" metrics stay honest even if the button is double-tapped.
  const filter = { _id: feedbackId };
  const update = resolved
    ? {
      $set: { updatedAt: new Date() },
      $setOnInsert: {},
      // Only stamp resolvedAt if not already stamped.
      $currentDate: {},
    }
    : { $set: { resolvedAt: null, updatedAt: new Date() } };

  let updated;
  if (resolved) {
    // Only set resolvedAt when currently null OR missing; otherwise keep original.
    updated = await Feedback.findOneAndUpdate(
      { _id: feedbackId, $or: [{ resolvedAt: null }, { resolvedAt: { $exists: false } }] },
      { $set: { resolvedAt: new Date() } },
      { new: true }
    );
    if (!updated) {
      // Either the doc doesn't exist, or it was already resolved. Distinguish.
      const existing = await Feedback.findById(feedbackId);
      if (!existing) throw createError(404, 'Feedback not found');
      updated = existing; // Already resolved — return current state unchanged.
    }
  } else {
    updated = await Feedback.findOneAndUpdate(filter, update, { new: true });
    if (!updated) throw createError(404, 'Feedback not found');
  }

  const populated = await Feedback.findById(updated._id)
    .populate({ path: 'user', select: 'displayName email' })
    .lean();
  return shapeFeedbackWithUser(populated);
};

module.exports = {
  submitFeedback,
  listFeedback,
  setFeedbackResolved,
  shapeFeedback,
  shapeFeedbackWithUser,
};
