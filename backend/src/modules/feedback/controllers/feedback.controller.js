const createError = require('http-errors');
const {
  submitFeedback,
  listFeedback,
  setFeedbackResolved,
} = require('../services/feedback.service');
const { assertAdminPermission, ADMIN_PERMISSIONS } = require('../../admin/permissions');

const submitFeedbackController = async (req, res, next) => {
  try {
    const feedback = await submitFeedback({
      userId: req.user?.id,
      payload: req.body || {},
    });
    return res.status(201).json({ feedback });
  } catch (error) {
    return next(error);
  }
};

const listFeedbackController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_FEEDBACK);
    const { status, limit, offset } = req.query;
    const result = await listFeedback({ status, limit, offset });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const resolveFeedbackController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_FEEDBACK);
    const { feedbackId } = req.params;
    // Strict boolean parse. A missing/non-boolean value MUST NOT default to
    // true — an empty PATCH would otherwise silently resolve the row.
    const rawResolved = req.body?.resolved;
    if (typeof rawResolved !== 'boolean') {
      throw createError(400, 'Request body must include boolean `resolved`');
    }
    const feedback = await setFeedbackResolved({ feedbackId, resolved: rawResolved });
    return res.json({ feedback });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  submitFeedbackController,
  listFeedbackController,
  resolveFeedbackController,
};
