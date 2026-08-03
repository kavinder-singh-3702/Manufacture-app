const {
  NOTIFICATION_LIFECYCLE_STATUSES,
  NOTIFICATION_DELIVERY_STATUSES,
} = require('../../../constants/notification');

/**
 * Single lifecycle calculator for a notification's `deliveries` array.
 * Previously two near-identical implementations existed — one in
 * notification.service.js (used at creation time) and one in
 * notificationDispatcher.service.js (used after each delivery attempt) — and
 * they disagreed on edge cases (e.g. all-delivered vs delivered+cancelled
 * mixes). This is now the only place lifecycle status is derived, so both the
 * immediate-delivery path and the dispatcher stay consistent.
 *
 * @param {Array<{status: string}>} deliveries
 * @param {{ scheduledAt?: Date|string|null }} [options]
 */
const computeLifecycleStatus = (deliveries = [], { scheduledAt } = {}) => {
  if (!deliveries.length) return NOTIFICATION_LIFECYCLE_STATUSES.COMPLETED;

  if (scheduledAt && new Date(scheduledAt) > new Date()) {
    return NOTIFICATION_LIFECYCLE_STATUSES.QUEUED;
  }

  const statuses = deliveries.map((item) => item.status);

  if (statuses.every((status) => status === NOTIFICATION_DELIVERY_STATUSES.CANCELLED)) {
    return NOTIFICATION_LIFECYCLE_STATUSES.CANCELLED;
  }

  if (
    statuses.every(
      (status) =>
        status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED ||
        status === NOTIFICATION_DELIVERY_STATUSES.CANCELLED
    )
  ) {
    return NOTIFICATION_LIFECYCLE_STATUSES.COMPLETED;
  }

  const hasQueuedOrSending = statuses.some(
    (status) =>
      status === NOTIFICATION_DELIVERY_STATUSES.QUEUED ||
      status === NOTIFICATION_DELIVERY_STATUSES.SENDING
  );
  const hasDelivered = statuses.some((status) => status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED);
  const hasFailed = statuses.some((status) => status === NOTIFICATION_DELIVERY_STATUSES.FAILED);

  if (hasQueuedOrSending) return NOTIFICATION_LIFECYCLE_STATUSES.DISPATCHING;
  if (hasDelivered && hasFailed) return NOTIFICATION_LIFECYCLE_STATUSES.PARTIALLY_SENT;
  if (hasDelivered) return NOTIFICATION_LIFECYCLE_STATUSES.COMPLETED;
  if (hasFailed) return NOTIFICATION_LIFECYCLE_STATUSES.PARTIALLY_SENT;
  return NOTIFICATION_LIFECYCLE_STATUSES.QUEUED;
};

module.exports = { computeLifecycleStatus };
