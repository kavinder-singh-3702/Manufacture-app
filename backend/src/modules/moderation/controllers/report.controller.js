const createError = require('http-errors');
const reportService = require('../services/report.service');

const createReportController = async (req, res, next) => {
  try {
    const reporter = req.user?.id;
    if (!reporter) throw createError(401, 'Authentication required');
    const report = await reportService.createReport({
      reporter,
      targetType: req.body.targetType,
      targetId: req.body.targetId,
      reason: req.body.reason,
      details: req.body.details,
    });
    return res.status(201).json({ report });
  } catch (err) {
    return next(err);
  }
};

const listReportsController = async (req, res, next) => {
  try {
    const result = await reportService.listReports(req.query || {});
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

const resolveReportController = async (req, res, next) => {
  try {
    const report = await reportService.resolveReport({
      reportId: req.params.reportId,
      adminId: req.user.id,
      action: req.body.action,
      notes: req.body.notes,
    });
    return res.json({ report });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createReportController,
  listReportsController,
  resolveReportController,
};
