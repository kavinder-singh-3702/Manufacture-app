const createError = require('http-errors');
const Party = require('../../../models/party.model');
const Account = require('../../../models/account.model');
const AccountingBill = require('../../../models/accountingBill.model');

const MAX_LIMIT = 100;

const getLedgerDefaults = (partyType) => {
  if (partyType === 'supplier') {
    return {
      type: 'liability',
      group: 'sundry_creditors'
    };
  }

  return {
    type: 'asset',
    group: 'sundry_debtors'
  };
};

const listParties = async (companyId, { type, search, limit = 50, offset = 0 } = {}) => {
  const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
  const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
  const cappedLimit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);

  const query = { company: companyId, deletedAt: { $exists: false } };
  if (type) query.type = type;
  if (search) query.name = new RegExp(search, 'i');

  const [parties, total] = await Promise.all([
    Party.find(query).sort({ name: 1 }).skip(parsedOffset).limit(cappedLimit).populate('ledgerAccount').lean(),
    Party.countDocuments(query)
  ]);

  return {
    parties,
    pagination: {
      total,
      limit: cappedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + parties.length < total
    }
  };
};

const getPartyById = async (companyId, partyId) => {
  return Party.findOne({
    _id: partyId,
    company: companyId,
    deletedAt: { $exists: false }
  })
    .populate('ledgerAccount')
    .lean();
};

const createParty = async (companyId, payload) => {
  const ledgerDefaults = getLedgerDefaults(payload.type);
  const ledger = await Account.create({
    company: companyId,
    name: `${payload.name} Ledger`,
    type: ledgerDefaults.type,
    group: ledgerDefaults.group,
    metadata: {
      partyManaged: true
    }
  });

  const party = await Party.create({
    company: companyId,
    name: payload.name,
    type: payload.type,
    ledgerAccount: ledger._id,
    gstin: payload.gstin,
    pan: payload.pan,
    contact: payload.contact,
    address: payload.address,
    creditDaysDefault: payload.creditDaysDefault,
    metadata: payload.metadata
  });

  return party.toObject();
};

const updateParty = async (companyId, partyId, payload) => {
  const party = await Party.findOne({
    _id: partyId,
    company: companyId,
    deletedAt: { $exists: false }
  });
  if (!party) return null;

  [
    'name',
    'type',
    'gstin',
    'pan',
    'contact',
    'address',
    'creditDaysDefault',
    'metadata'
  ].forEach((field) => {
    if (payload[field] !== undefined) {
      party[field] = payload[field];
    }
  });

  await party.save();
  return party.toObject();
};

const deleteParty = async (companyId, partyId, { force = false } = {}) => {
  const party = await Party.findOne({
    _id: partyId,
    company: companyId,
    deletedAt: { $exists: false }
  });
  if (!party) return null;

  if (!force) {
    const openBills = await AccountingBill.exists({
      company: companyId,
      party: partyId,
      status: 'open',
      isVoided: { $ne: true }
    });

    if (openBills) {
      throw createError(409, 'Party has open bills. Use force=true to archive anyway');
    }
  }

  party.deletedAt = new Date();
  await party.save();
  return true;
};

module.exports = {
  listParties,
  getPartyById,
  createParty,
  updateParty,
  deleteParty
};

