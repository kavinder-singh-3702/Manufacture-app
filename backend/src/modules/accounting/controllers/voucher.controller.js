const createError = require('http-errors');
const {
  createVoucher,
  listVouchers,
  getVoucherById,
  updateVoucher,
  postDraftVoucher,
  voidVoucher,
  listVoucherLogs
} = require('../services/voucher.service');
const { ensureAccountingSetup } = require('../services/bootstrap.service');

const requireCompanyId = (req) => {
  const companyId = req.user?.activeCompany;
  if (!companyId) {
    throw createError(400, 'No active company selected');
  }
  return companyId;
};

const listVouchersController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    await ensureAccountingSetup(companyId);
    const result = await listVouchers(companyId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getVoucherController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const voucher = await getVoucherById(companyId, req.params.voucherId);
    if (!voucher) {
      throw createError(404, 'Voucher not found');
    }
    return res.json({ voucher });
  } catch (error) {
    return next(error);
  }
};

const createVoucherController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const voucher = await createVoucher(companyId, req.user?.id, req.body, { status: req.body.status });
    return res.status(201).json({ voucher });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Duplicate voucher request (idempotency key conflict)' });
    }
    return next(error);
  }
};

const updateVoucherController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const voucher = await updateVoucher(companyId, req.params.voucherId, req.user?.id, req.body);
    if (!voucher) {
      throw createError(404, 'Voucher not found');
    }
    return res.json({ voucher });
  } catch (error) {
    return next(error);
  }
};

const postDraftVoucherController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const voucher = await postDraftVoucher(companyId, req.params.voucherId, req.user?.id);
    if (!voucher) {
      throw createError(404, 'Voucher not found');
    }
    return res.json({ voucher });
  } catch (error) {
    return next(error);
  }
};

const voidVoucherController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const voucher = await voidVoucher(companyId, req.params.voucherId, req.user?.id, req.body?.reason);
    if (!voucher) {
      throw createError(404, 'Voucher not found');
    }
    return res.json({ voucher });
  } catch (error) {
    return next(error);
  }
};

const listVoucherLogsController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const result = await listVoucherLogs(companyId, req.params.voucherId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listVouchersController,
  getVoucherController,
  createVoucherController,
  updateVoucherController,
  postDraftVoucherController,
  voidVoucherController,
  listVoucherLogsController
};

