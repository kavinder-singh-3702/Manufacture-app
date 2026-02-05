const createError = require('http-errors');
const Account = require('../../../models/account.model');
const LedgerPosting = require('../../../models/ledgerPosting.model');

const MAX_LIMIT = 100;

const listAccounts = async (companyId, { type, group, search, limit = 50, offset = 0 } = {}) => {
  const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
  const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
  const cappedLimit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);

  const query = { company: companyId, deletedAt: { $exists: false } };
  if (type) query.type = type;
  if (group) query.group = group;
  if (search) query.name = new RegExp(search, 'i');

  const [accounts, total] = await Promise.all([
    Account.find(query).sort({ isSystem: -1, name: 1 }).skip(parsedOffset).limit(cappedLimit).lean(),
    Account.countDocuments(query)
  ]);

  return {
    accounts,
    pagination: {
      total,
      limit: cappedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + accounts.length < total
    }
  };
};

const getAccountById = async (companyId, accountId) => {
  return Account.findOne({
    _id: accountId,
    company: companyId,
    deletedAt: { $exists: false }
  }).lean();
};

const createAccount = async (companyId, payload) => {
  const account = await Account.create({
    company: companyId,
    name: payload.name,
    type: payload.type,
    group: payload.group,
    key: payload.key,
    openingBalance: payload.openingBalance,
    metadata: payload.metadata
  });

  return account.toObject();
};

const updateAccount = async (companyId, accountId, payload) => {
  const account = await Account.findOne({
    _id: accountId,
    company: companyId,
    deletedAt: { $exists: false }
  });
  if (!account) return null;
  if (account.isSystem) {
    throw createError(403, 'System accounts cannot be edited');
  }

  ['name', 'type', 'group', 'openingBalance', 'metadata'].forEach((field) => {
    if (payload[field] !== undefined) {
      account[field] = payload[field];
    }
  });
  await account.save();
  return account.toObject();
};

const deleteAccount = async (companyId, accountId) => {
  const account = await Account.findOne({
    _id: accountId,
    company: companyId,
    deletedAt: { $exists: false }
  });

  if (!account) return null;
  if (account.isSystem) {
    throw createError(403, 'System accounts cannot be deleted');
  }

  const hasPostings = await LedgerPosting.exists({
    company: companyId,
    account: accountId,
    isVoided: { $ne: true }
  });
  if (hasPostings) {
    throw createError(409, 'Account cannot be deleted because it has ledger postings');
  }

  account.deletedAt = new Date();
  await account.save();
  return true;
};

module.exports = {
  listAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount
};

