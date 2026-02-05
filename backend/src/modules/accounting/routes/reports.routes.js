const { Router } = require('express');
const validate = require('../../../middleware/validate');
const {
  dashboardController,
  trialBalanceController,
  pnlController,
  gstSummaryController,
  partyOutstandingController,
  stockSummaryController,
  stockLedgerController,
  ledgerReportController
} = require('../controllers/reports.controller');
const {
  dateRangeValidation,
  partyOutstandingValidation,
  stockSummaryValidation,
  stockLedgerValidation,
  ledgerReportValidation
} = require('../validators/reports.validators');

const router = Router();

router.get('/dashboard', validate(dateRangeValidation), dashboardController);
router.get('/trial-balance', validate(dateRangeValidation), trialBalanceController);
router.get('/pnl', validate(dateRangeValidation), pnlController);
router.get('/gst-summary', validate(dateRangeValidation), gstSummaryController);
router.get('/party-outstanding', validate(partyOutstandingValidation), partyOutstandingController);
router.get('/stock-summary', validate(stockSummaryValidation), stockSummaryController);
router.get('/stock-ledger', validate(stockLedgerValidation), stockLedgerController);
router.get('/ledger/:accountId', validate(ledgerReportValidation), ledgerReportController);

module.exports = router;

