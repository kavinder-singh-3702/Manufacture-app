const createError = require('http-errors');
const {
  dashboard,
  trialBalance,
  profitAndLoss,
  gstSummary,
  partyOutstanding,
  stockSummary,
  stockLedger,
  ledgerReport
} = require('../services/reports.service');
const { ensureAccountingSetup } = require('../services/bootstrap.service');

const requireCompanyId = (req) => {
  const companyId = req.user?.activeCompany;
  if (!companyId) {
    throw createError(400, 'No active company selected');
  }
  return companyId;
};

const dashboardController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    await ensureAccountingSetup(companyId);
    const result = await dashboard(companyId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const trialBalanceController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const result = await trialBalance(companyId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const pnlController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const result = await profitAndLoss(companyId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const gstSummaryController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const result = await gstSummary(companyId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const partyOutstandingController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const result = await partyOutstanding(companyId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const stockSummaryController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const result = await stockSummary(companyId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const stockLedgerController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const result = await stockLedger(companyId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const ledgerReportController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const result = await ledgerReport(companyId, req.params.accountId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  dashboardController,
  trialBalanceController,
  pnlController,
  gstSummaryController,
  partyOutstandingController,
  stockSummaryController,
  stockLedgerController,
  ledgerReportController
};

