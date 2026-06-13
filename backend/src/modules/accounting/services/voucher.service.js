const createError = require('http-errors');
const mongoose = require('mongoose');
const AccountingVoucher = require('../../../models/accountingVoucher.model');
const LedgerPosting = require('../../../models/ledgerPosting.model');
const StockMove = require('../../../models/stockMove.model');
const AccountingBill = require('../../../models/accountingBill.model');
const AccountingVoucherLog = require('../../../models/accountingVoucherLog.model');
const Party = require('../../../models/party.model');
const Unit = require('../../../models/unit.model');
const {
  SYSTEM_ACCOUNT_KEYS,
  VOUCHER_TYPES,
  VOUCHER_STATUSES
} = require('../../../constants/accounting');
const { ensureAccountingSetup } = require('./bootstrap.service');
const { reserveVoucherNumber } = require('./sequence.service');
const { buildArtifacts } = require('./postingEngine.service');
const { applyStockMoves, reverseStockMoves } = require('./inventory.service');
const {
  ensureArray,
  roundMoney,
  parseDateOrDefault,
  sanitizeMeta,
  isSameDayInTimezone
} = require('./helpers');

const MAX_LIMIT = 100;

const mapToObject = (value) => (value instanceof Map ? Object.fromEntries(value) : value);

const normalizeVoucher = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject({ versionKey: false }) : doc;
  return {
    ...plain,
    meta: mapToObject(plain.meta) || {}
  };
};

const getPartyForVoucher = async (companyId, partyId, session) => {
  if (!partyId) return null;
  const party = await Party.findOne({
    _id: partyId,
    company: companyId,
    deletedAt: { $exists: false }
  }).session(session);
  if (!party) {
    throw createError(404, 'Party not found');
  }
  return party;
};

const getUnitsForVoucher = async (companyId, session) => {
  return Unit.find({
    company: companyId,
    deletedAt: { $exists: false }
  })
    .select('_id name symbol conversionFactorToBase')
    .lean()
    .session(session);
};

const validateFinalPostings = (postings) => {
  const debit = roundMoney(postings.reduce((sum, posting) => sum + Number(posting.debit || 0), 0));
  const credit = roundMoney(postings.reduce((sum, posting) => sum + Number(posting.credit || 0), 0));
  if (debit !== credit) {
    throw createError(422, `Voucher posting imbalance detected (debit ${debit} != credit ${credit})`);
  }
};

const getStockAutoPostings = ({ voucherType, stockMoves, systemAccounts }) => {
  const outCost = roundMoney(
    ensureArray(stockMoves)
      .filter((move) => move.direction === 'out')
      .reduce((sum, move) => sum + Number(move.costValue || 0), 0)
  );
  const inValue = roundMoney(
    ensureArray(stockMoves)
      .filter((move) => move.direction === 'in')
      .reduce((sum, move) => sum + Number(move.value || 0), 0)
  );

  const postings = [];
  let cogsValue = 0;

  if (voucherType === 'sales_invoice' || voucherType === 'debit_note') {
    if (outCost > 0) {
      postings.push(
        { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.COGS]._id, debit: outCost, credit: 0 },
        { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INVENTORY]._id, debit: 0, credit: outCost }
      );
      cogsValue = outCost;
    }
  } else if (voucherType === 'credit_note') {
    if (inValue > 0) {
      postings.push(
        { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INVENTORY]._id, debit: inValue, credit: 0 },
        { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.COGS]._id, debit: 0, credit: inValue }
      );
      cogsValue = inValue;
    }
  } else if (voucherType === 'stock_adjustment') {
    if (inValue > 0) {
      postings.push(
        { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INVENTORY]._id, debit: inValue, credit: 0 },
        { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INVENTORY_ADJUSTMENT]._id, debit: 0, credit: inValue }
      );
    }
    if (outCost > 0) {
      postings.push(
        { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INVENTORY_ADJUSTMENT]._id, debit: outCost, credit: 0 },
        { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INVENTORY]._id, debit: 0, credit: outCost }
      );
      cogsValue = outCost;
    }
  }

  return {
    postings,
    cogsValue
  };
};

const settleOpenBillsFIFO = async ({ companyId, partyId, billType, amount, session }) => {
  let remaining = roundMoney(amount);
  if (remaining <= 0) return [];

  const bills = await AccountingBill.find({
    company: companyId,
    party: partyId,
    billType,
    status: 'open',
    isVoided: { $ne: true },
    balanceAmount: { $gt: 0 }
  })
    .sort({ dueDate: 1, billDate: 1, createdAt: 1 })
    .session(session);

  const allocations = [];
  for (const bill of bills) {
    if (remaining <= 0) break;
    const balanceAmount = roundMoney(bill.balanceAmount);
    if (balanceAmount <= 0) continue;

    const appliedAmount = roundMoney(Math.min(balanceAmount, remaining));
    bill.settledAmount = roundMoney(Number(bill.settledAmount || 0) + appliedAmount);
    bill.balanceAmount = roundMoney(balanceAmount - appliedAmount);
    bill.status = bill.balanceAmount <= 0 ? 'closed' : 'open';
    await bill.save({ session });

    allocations.push({
      billId: bill._id.toString(),
      amount: appliedAmount
    });
    remaining = roundMoney(remaining - appliedAmount);
  }

  return allocations;
};

const reverseBillSettlements = async ({ settlements, session }) => {
  for (const settlement of ensureArray(settlements)) {
    const bill = await AccountingBill.findById(settlement.billId).session(session);
    if (!bill || bill.isVoided) continue;
    const amount = roundMoney(settlement.amount);
    bill.settledAmount = roundMoney(Math.max(0, Number(bill.settledAmount || 0) - amount));
    bill.balanceAmount = roundMoney(Number(bill.balanceAmount || 0) + amount);
    bill.status = bill.balanceAmount > 0 ? 'open' : 'closed';
    await bill.save({ session });
  }
};

const applyBillOperations = async ({
  voucher,
  companyId,
  party,
  billOps,
  session
}) => {
  const settlementAllocations = [];

  for (const op of ensureArray(billOps)) {
    if (op.op === 'create') {
      await AccountingBill.create(
        [
          {
            company: companyId,
            party: party._id,
            voucher: voucher._id,
            billType: op.billType,
            billNumber: voucher.voucherNumber,
            billDate: voucher.date,
            dueDate: op.dueDate || voucher.date,
            totalAmount: roundMoney(op.amount),
            settledAmount: 0,
            balanceAmount: roundMoney(op.amount),
            status: roundMoney(op.amount) > 0 ? 'open' : 'closed',
            meta: sanitizeMeta(op.meta)
          }
        ],
        { session }
      );
      continue;
    }

    if (op.op === 'settle') {
      const allocations = await settleOpenBillsFIFO({
        companyId,
        partyId: party._id,
        billType: op.billType,
        amount: op.amount,
        session
      });
      settlementAllocations.push(...allocations);
    }
  }

  return settlementAllocations;
};

const createVoucherLog = async ({
  companyId,
  voucherId,
  revision,
  action,
  actorUserId,
  before,
  after,
  session
}) => {
  await AccountingVoucherLog.create(
    [
      {
        company: companyId,
        voucher: voucherId,
        revision,
        action,
        actor: actorUserId,
        before,
        after,
        changes: []
      }
    ],
    { session }
  );
};

const markVoucherArtifactsVoided = async ({ voucher, session }) => {
  await LedgerPosting.updateMany(
    {
      voucher: voucher._id,
      revision: voucher.revision,
      isVoided: { $ne: true }
    },
    { $set: { isVoided: true, voidedAt: new Date() } },
    { session }
  );

  const stockMoves = await StockMove.find({
    voucher: voucher._id,
    revision: voucher.revision,
    isVoided: { $ne: true }
  }).session(session);

  if (stockMoves.length) {
    await reverseStockMoves(voucher.company, stockMoves, { session });
  }

  await StockMove.updateMany(
    {
      voucher: voucher._id,
      revision: voucher.revision,
      isVoided: { $ne: true }
    },
    { $set: { isVoided: true, voidedAt: new Date() } },
    { session }
  );

  await AccountingBill.updateMany(
    {
      voucher: voucher._id,
      isVoided: { $ne: true }
    },
    { $set: { isVoided: true, voidedAt: new Date(), status: 'voided' } },
    { session }
  );

  const meta = mapToObject(voucher.meta) || {};
  await reverseBillSettlements({
    settlements: meta.billSettlements,
    session
  });
};

const persistVoucherArtifacts = async ({
  voucher,
  artifacts,
  companyId,
  systemAccounts,
  party,
  session
}) => {
  let stockMoves = [];
  if (artifacts.stockMoves.length) {
    stockMoves = await applyStockMoves(companyId, artifacts.stockMoves, {
      preventNegativeStock: true,
      session
    });

    if (stockMoves.length) {
      await StockMove.insertMany(
        stockMoves.map((move) => ({
          company: companyId,
          voucher: voucher._id,
          revision: voucher.revision,
          voucherType: voucher.voucherType,
          voucherNumber: voucher.voucherNumber,
          date: voucher.date,
          product: move.product,
          variant: move.variant,
          direction: move.direction,
          quantityBase: move.quantityBase,
          displayQuantity: move.displayQuantity,
          displayUnit: move.displayUnit,
          rate: move.rate,
          value: move.value,
          costRate: move.costRate,
          costValue: move.costValue,
          meta: sanitizeMeta(move.meta)
        })),
        { session }
      );
    }
  }

  const autoPostings = getStockAutoPostings({
    voucherType: voucher.voucherType,
    stockMoves,
    systemAccounts
  });
  const postings = [...artifacts.postings, ...autoPostings.postings];
  validateFinalPostings(postings);

  if (postings.length) {
    await LedgerPosting.insertMany(
      postings.map((posting) => ({
        company: companyId,
        voucher: voucher._id,
        revision: voucher.revision,
        voucherType: voucher.voucherType,
        voucherNumber: voucher.voucherNumber,
        date: voucher.date,
        account: posting.account,
        party: posting.party || party?._id,
        debit: roundMoney(posting.debit),
        credit: roundMoney(posting.credit),
        meta: sanitizeMeta(posting.meta)
      })),
      { session }
    );
  }

  const billSettlements = party
    ? await applyBillOperations({
        voucher,
        companyId,
        party,
        billOps: artifacts.billOps,
        session
      })
    : [];

  voucher.totals = {
    ...(voucher.totals || {}),
    ...(artifacts.voucherDocPatch.totals || {}),
    cogs: autoPostings.cogsValue
  };

  const currentMeta = mapToObject(voucher.meta) || {};
  voucher.meta = {
    ...currentMeta,
    billSettlements,
    rawPayload: artifacts.voucherDocPatch.meta?.rawPayload
  };
  await voucher.save({ session });
};

const buildVoucherAndArtifacts = async ({
  companyId,
  setup,
  payload,
  party,
  voucherType,
  session
}) => {
  const units = await getUnitsForVoucher(companyId, session);
  const artifacts = buildArtifacts({
    voucherType,
    payload,
    company: setup.company,
    systemAccounts: setup.systemAccountsByKey,
    units,
    party
  });
  return artifacts;
};

const createVoucher = async (companyId, userId, payload, { status } = {}) => {
  const session = await mongoose.startSession();
  let voucher = null;

  try {
    await session.withTransaction(async () => {
      const setup = await ensureAccountingSetup(companyId, { session, asOfDate: parseDateOrDefault(payload?.date) });
      if (!setup) throw createError(404, 'Company not found');

      const requestedStatus = status || payload?.status || 'posted';
      if (!VOUCHER_STATUSES.includes(requestedStatus)) {
        throw createError(422, 'Invalid voucher status');
      }
      if (requestedStatus === 'voided') {
        throw createError(422, 'Cannot create voucher directly in voided state');
      }

      const voucherType = payload?.voucherType;
      if (!VOUCHER_TYPES.includes(voucherType)) {
        throw createError(422, 'voucherType is required');
      }

      const idempotencyKey = payload?.idempotencyKey || payload?.meta?.idempotencyKey;
      if (idempotencyKey) {
        const existing = await AccountingVoucher.findOne({
          company: companyId,
          idempotencyKey
        }).session(session);
        if (existing) {
          voucher = normalizeVoucher(existing);
          return;
        }
      }

      const party = await getPartyForVoucher(companyId, payload?.partyId || payload?.party, session);
      const artifacts = await buildVoucherAndArtifacts({
        companyId,
        setup,
        payload,
        party,
        voucherType,
        session
      });

      const voucherDocData = {
        company: companyId,
        voucherType,
        status: requestedStatus,
        date: artifacts.voucherDocPatch.date,
        party: artifacts.voucherDocPatch.party,
        referenceNumber: artifacts.voucherDocPatch.referenceNumber,
        narration: artifacts.voucherDocPatch.narration,
        currency: artifacts.voucherDocPatch.currency,
        gst: artifacts.voucherDocPatch.gst,
        lines: artifacts.voucherDocPatch.lines,
        totals: artifacts.voucherDocPatch.totals,
        meta: sanitizeMeta({
          ...(payload?.meta || {}),
          rawPayload: payload
        }),
        createdBy: userId,
        lastUpdatedBy: userId
      };
      // idempotencyKey is optional; omit the field entirely when absent so the sparse unique index behaves as intended.
      if (idempotencyKey) {
        voucherDocData.idempotencyKey = idempotencyKey;
      }

      const doc = new AccountingVoucher(voucherDocData);

      if (requestedStatus === 'posted') {
        const sequence = await reserveVoucherNumber({
          companyId,
          voucherType,
          date: doc.date,
          fiscalYearStartMonth: setup.fiscalYearStartMonth,
          session
        });

        doc.fiscalYearKey = sequence.fiscalYearKey;
        doc.sequenceNumber = sequence.sequenceNumber;
        doc.voucherNumber = sequence.voucherNumber;
        doc.postedAt = new Date();
        doc.postedBy = userId;
      }

      await doc.save({ session });

      if (requestedStatus === 'posted') {
        await persistVoucherArtifacts({
          voucher: doc,
          artifacts,
          companyId,
          systemAccounts: setup.systemAccountsByKey,
          party,
          session
        });
      }

      await createVoucherLog({
        companyId,
        voucherId: doc._id,
        revision: doc.revision,
        action: 'created',
        actorUserId: userId,
        after: normalizeVoucher(doc),
        session
      });

      if (requestedStatus === 'posted') {
        await createVoucherLog({
          companyId,
          voucherId: doc._id,
          revision: doc.revision,
          action: 'posted',
          actorUserId: userId,
          after: normalizeVoucher(doc),
          session
        });
      }

      voucher = normalizeVoucher(doc);
    });
  } finally {
    await session.endSession();
  }

  return voucher;
};

const listVouchers = async (
  companyId,
  {
    voucherType,
    status,
    partyId,
    from,
    to,
    search,
    limit = 20,
    offset = 0
  } = {}
) => {
  const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;
  const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
  const cappedLimit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);

  const query = {
    company: companyId
  };
  if (voucherType) query.voucherType = voucherType;
  if (status) query.status = status;
  if (partyId) query.party = partyId;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = parseDateOrDefault(from);
    if (to) query.date.$lte = parseDateOrDefault(to);
  }
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ voucherNumber: regex }, { referenceNumber: regex }, { narration: regex }];
  }

  const [vouchers, total] = await Promise.all([
    AccountingVoucher.find(query)
      .populate('party', 'name')
      .sort({ date: -1, createdAt: -1 })
      .skip(parsedOffset)
      .limit(cappedLimit)
      .lean(),
    AccountingVoucher.countDocuments(query)
  ]);

  return {
    vouchers: vouchers.map(normalizeVoucher),
    pagination: {
      total,
      limit: cappedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + vouchers.length < total
    }
  };
};

const getVoucherById = async (companyId, voucherId) => {
  const voucher = await AccountingVoucher.findOne({
    _id: voucherId,
    company: companyId
  }).lean();
  return normalizeVoucher(voucher);
};

const updateVoucher = async (companyId, voucherId, userId, payload) => {
  const session = await mongoose.startSession();
  let voucher = null;

  try {
    await session.withTransaction(async () => {
      const setup = await ensureAccountingSetup(companyId, { session, asOfDate: parseDateOrDefault(payload?.date) });
      if (!setup) throw createError(404, 'Company not found');

      const doc = await AccountingVoucher.findOne({ _id: voucherId, company: companyId }).session(session);
      if (!doc) {
        voucher = null;
        return;
      }

      if (doc.status === 'voided') {
        throw createError(409, 'Voided voucher cannot be edited');
      }

      const before = normalizeVoucher(doc);
      const nextVoucherType = payload?.voucherType || doc.voucherType;
      const nextParty = await getPartyForVoucher(companyId, payload?.partyId || payload?.party || doc.party, session);
      const artifacts = await buildVoucherAndArtifacts({
        companyId,
        setup,
        payload: {
          ...(mapToObject(doc.meta)?.rawPayload || {}),
          ...payload,
          voucherType: nextVoucherType
        },
        party: nextParty,
        voucherType: nextVoucherType,
        session
      });

      const now = new Date();
      if (doc.status === 'posted') {
        if (nextVoucherType !== doc.voucherType) {
          throw createError(422, 'voucherType cannot be changed for posted voucher');
        }
        const timezone = setup.company?.settings?.timezone || 'UTC';
        if (!isSameDayInTimezone(doc.postedAt || doc.createdAt, now, timezone)) {
          throw createError(409, 'Posted voucher can only be edited on the same day. Please void and recreate.');
        }
        await markVoucherArtifactsVoided({ voucher: doc, session });
        doc.revision += 1;
      }

      doc.voucherType = nextVoucherType;
      doc.date = artifacts.voucherDocPatch.date;
      doc.party = artifacts.voucherDocPatch.party;
      doc.referenceNumber = artifacts.voucherDocPatch.referenceNumber;
      doc.narration = artifacts.voucherDocPatch.narration;
      doc.currency = artifacts.voucherDocPatch.currency;
      doc.gst = artifacts.voucherDocPatch.gst;
      doc.lines = artifacts.voucherDocPatch.lines;
      doc.totals = artifacts.voucherDocPatch.totals;
      doc.lastUpdatedBy = userId;
      doc.meta = sanitizeMeta({
        ...(mapToObject(doc.meta) || {}),
        ...(payload?.meta || {}),
        rawPayload: {
          ...(mapToObject(doc.meta)?.rawPayload || {}),
          ...payload,
          voucherType: nextVoucherType
        }
      });

      if (doc.status === 'draft' && (payload?.status === 'posted' || payload?.postNow === true)) {
        const sequence = await reserveVoucherNumber({
          companyId,
          voucherType: nextVoucherType,
          date: doc.date,
          fiscalYearStartMonth: setup.fiscalYearStartMonth,
          session
        });
        doc.status = 'posted';
        doc.fiscalYearKey = sequence.fiscalYearKey;
        doc.sequenceNumber = sequence.sequenceNumber;
        doc.voucherNumber = sequence.voucherNumber;
        doc.postedAt = now;
        doc.postedBy = userId;
      }

      await doc.save({ session });

      if (doc.status === 'posted') {
        await persistVoucherArtifacts({
          voucher: doc,
          artifacts,
          companyId,
          systemAccounts: setup.systemAccountsByKey,
          party: nextParty,
          session
        });
      }

      await createVoucherLog({
        companyId,
        voucherId: doc._id,
        revision: doc.revision,
        action: 'updated',
        actorUserId: userId,
        before,
        after: normalizeVoucher(doc),
        session
      });

      voucher = normalizeVoucher(doc);
    });
  } finally {
    await session.endSession();
  }

  return voucher;
};

const postDraftVoucher = async (companyId, voucherId, userId) => {
  const existing = await AccountingVoucher.findOne({ _id: voucherId, company: companyId }).lean();
  if (!existing) return null;
  if (existing.status !== 'draft') {
    throw createError(409, 'Only draft vouchers can be posted');
  }

  return updateVoucher(companyId, voucherId, userId, { status: 'posted', postNow: true });
};

const voidVoucher = async (companyId, voucherId, userId, reason) => {
  const session = await mongoose.startSession();
  let voucher = null;

  try {
    await session.withTransaction(async () => {
      const doc = await AccountingVoucher.findOne({
        _id: voucherId,
        company: companyId
      }).session(session);

      if (!doc) {
        voucher = null;
        return;
      }
      if (doc.status === 'voided') {
        voucher = normalizeVoucher(doc);
        return;
      }

      const before = normalizeVoucher(doc);

      if (doc.status === 'posted') {
        await markVoucherArtifactsVoided({ voucher: doc, session });
      }

      doc.status = 'voided';
      doc.voidedAt = new Date();
      doc.voidedBy = userId;
      doc.voidReason = reason;
      doc.lastUpdatedBy = userId;
      await doc.save({ session });

      await createVoucherLog({
        companyId,
        voucherId: doc._id,
        revision: doc.revision,
        action: 'voided',
        actorUserId: userId,
        before,
        after: normalizeVoucher(doc),
        session
      });

      voucher = normalizeVoucher(doc);
    });
  } finally {
    await session.endSession();
  }

  return voucher;
};

const listVoucherLogs = async (companyId, voucherId, { limit = 50, offset = 0 } = {}) => {
  const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
  const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
  const cappedLimit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);

  const [logs, total] = await Promise.all([
    AccountingVoucherLog.find({ company: companyId, voucher: voucherId })
      .sort({ createdAt: -1, revision: -1 })
      .skip(parsedOffset)
      .limit(cappedLimit)
      .lean(),
    AccountingVoucherLog.countDocuments({ company: companyId, voucher: voucherId })
  ]);

  return {
    logs,
    pagination: {
      total,
      limit: cappedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + logs.length < total
    }
  };
};

module.exports = {
  createVoucher,
  listVouchers,
  getVoucherById,
  updateVoucher,
  postDraftVoucher,
  voidVoucher,
  listVoucherLogs
};
