const createError = require('http-errors');
const {
  listAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount
} = require('../services/account.service');
const { ensureAccountingSetup } = require('../services/bootstrap.service');

const requireCompanyId = (req) => {
  const companyId = req.user?.activeCompany;
  if (!companyId) {
    throw createError(400, 'No active company selected');
  }
  return companyId;
};

const listAccountsController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    await ensureAccountingSetup(companyId);
    const result = await listAccounts(companyId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getAccountController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const account = await getAccountById(companyId, req.params.accountId);
    if (!account) {
      throw createError(404, 'Account not found');
    }
    return res.json({ account });
  } catch (error) {
    return next(error);
  }
};

const createAccountController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const account = await createAccount(companyId, req.body);
    return res.status(201).json({ account });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Account with same name or key already exists' });
    }
    return next(error);
  }
};

const updateAccountController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const account = await updateAccount(companyId, req.params.accountId, req.body);
    if (!account) {
      throw createError(404, 'Account not found');
    }
    return res.json({ account });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Account with same name already exists' });
    }
    return next(error);
  }
};

const deleteAccountController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const deleted = await deleteAccount(companyId, req.params.accountId);
    if (!deleted) {
      throw createError(404, 'Account not found');
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listAccountsController,
  getAccountController,
  createAccountController,
  updateAccountController,
  deleteAccountController
};

