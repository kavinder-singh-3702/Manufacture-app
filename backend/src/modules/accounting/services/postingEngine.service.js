const createError = require('http-errors');
const {
  SYSTEM_ACCOUNT_KEYS,
  VOUCHER_TYPES,
  GST_TYPES
} = require('../../../constants/accounting');
const { computeVoucherTaxes, resolveGstType } = require('./gst.service');
const { ensureArray, roundMoney, roundQuantity, parseDateOrDefault } = require('./helpers');

const VOUCHER_TYPES_WITH_TAX = new Set(['sales_invoice', 'purchase_bill', 'credit_note', 'debit_note']);

const buildUnitFactorLookup = (units) => {
  const lookup = new Map();
  ensureArray(units).forEach((unit) => {
    const factor = Number(unit.conversionFactorToBase || 1);
    if (unit._id) lookup.set(unit._id.toString(), factor);
    if (unit.name) lookup.set(String(unit.name).trim().toLowerCase(), factor);
    if (unit.symbol) lookup.set(String(unit.symbol).trim().toLowerCase(), factor);
  });
  return lookup;
};

const resolveLineUnitFactor = (line, unitFactorLookup) => {
  const unitValue = line?.unit;
  if (!unitValue) return 1;

  if (typeof unitValue === 'string') {
    return Number(unitFactorLookup.get(unitValue.trim().toLowerCase()) || 1);
  }
  if (typeof unitValue === 'object') {
    if (unitValue._id) return Number(unitFactorLookup.get(String(unitValue._id)) || 1);
    if (unitValue.id) return Number(unitFactorLookup.get(String(unitValue.id)) || 1);
    if (unitValue.name) return Number(unitFactorLookup.get(String(unitValue.name).trim().toLowerCase()) || 1);
    if (unitValue.symbol) return Number(unitFactorLookup.get(String(unitValue.symbol).trim().toLowerCase()) || 1);
  }
  return 1;
};

const sumTaxBucket = (taxBuckets) => roundMoney(Number(taxBuckets?.cgst || 0) + Number(taxBuckets?.sgst || 0) + Number(taxBuckets?.igst || 0));

const addTaxPostings = ({ postings, taxBuckets, mode, systemAccounts }) => {
  if (!taxBuckets) return;

  const cgst = roundMoney(taxBuckets.cgst);
  const sgst = roundMoney(taxBuckets.sgst);
  const igst = roundMoney(taxBuckets.igst);

  if (mode === 'output_credit') {
    if (cgst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.OUTPUT_CGST]._id, credit: cgst, debit: 0 });
    if (sgst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.OUTPUT_SGST]._id, credit: sgst, debit: 0 });
    if (igst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.OUTPUT_IGST]._id, credit: igst, debit: 0 });
    return;
  }

  if (mode === 'output_debit') {
    if (cgst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.OUTPUT_CGST]._id, debit: cgst, credit: 0 });
    if (sgst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.OUTPUT_SGST]._id, debit: sgst, credit: 0 });
    if (igst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.OUTPUT_IGST]._id, debit: igst, credit: 0 });
    return;
  }

  if (mode === 'input_debit') {
    if (cgst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INPUT_CGST]._id, debit: cgst, credit: 0 });
    if (sgst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INPUT_SGST]._id, debit: sgst, credit: 0 });
    if (igst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INPUT_IGST]._id, debit: igst, credit: 0 });
    return;
  }

  if (mode === 'input_credit') {
    if (cgst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INPUT_CGST]._id, credit: cgst, debit: 0 });
    if (sgst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INPUT_SGST]._id, credit: sgst, debit: 0 });
    if (igst > 0) postings.push({ account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INPUT_IGST]._id, credit: igst, debit: 0 });
  }
};

const buildStockMovesFromItems = ({ items, direction, unitFactorLookup, date, voucherType, meta = {} }) => {
  return ensureArray(items).map((line) => {
    const quantity = Number(line?.quantity || 0);
    const unitFactor = resolveLineUnitFactor(line, unitFactorLookup);
    const quantityBase = roundQuantity(quantity * unitFactor);
    const rate = roundMoney(Number(line?.rate || 0));
    const value = direction === 'in' ? roundMoney(Number(line?.amount || quantity * rate)) : 0;

    return {
      product: line.product,
      variant: line.variant,
      direction,
      quantityBase,
      displayQuantity: roundQuantity(quantity),
      displayUnit: typeof line.unit === 'string' ? line.unit : undefined,
      rate,
      value,
      date,
      voucherType,
      meta
    };
  }).filter((move) => move.product && move.quantityBase > 0);
};

const validateSystemAccounts = (systemAccounts) => {
  const requiredKeys = [
    SYSTEM_ACCOUNT_KEYS.CASH,
    SYSTEM_ACCOUNT_KEYS.BANK,
    SYSTEM_ACCOUNT_KEYS.SALES,
    SYSTEM_ACCOUNT_KEYS.SALES_RETURN,
    SYSTEM_ACCOUNT_KEYS.PURCHASES,
    SYSTEM_ACCOUNT_KEYS.PURCHASE_RETURN,
    SYSTEM_ACCOUNT_KEYS.INVENTORY,
    SYSTEM_ACCOUNT_KEYS.COGS,
    SYSTEM_ACCOUNT_KEYS.INVENTORY_ADJUSTMENT,
    SYSTEM_ACCOUNT_KEYS.INPUT_CGST,
    SYSTEM_ACCOUNT_KEYS.INPUT_SGST,
    SYSTEM_ACCOUNT_KEYS.INPUT_IGST,
    SYSTEM_ACCOUNT_KEYS.OUTPUT_CGST,
    SYSTEM_ACCOUNT_KEYS.OUTPUT_SGST,
    SYSTEM_ACCOUNT_KEYS.OUTPUT_IGST
  ];

  const missing = requiredKeys.filter((key) => !systemAccounts[key]);
  if (missing.length) {
    throw createError(500, `Accounting system accounts are missing: ${missing.join(', ')}`);
  }
};

const buildArtifacts = ({
  voucherType,
  payload,
  company,
  systemAccounts,
  units,
  party
}) => {
  if (!VOUCHER_TYPES.includes(voucherType)) {
    throw createError(422, 'Unsupported voucher type');
  }
  validateSystemAccounts(systemAccounts);

  const date = parseDateOrDefault(payload?.date);
  const unitFactorLookup = buildUnitFactorLookup(units);
  const postings = [];
  const stockMoves = [];
  const billOps = [];
  const linesItems = ensureArray(payload?.lines?.items || payload?.items);
  const linesCharges = ensureArray(payload?.lines?.charges || payload?.charges);
  const journalLines = ensureArray(payload?.lines?.journal || payload?.journalLines || payload?.journal);
  const roundOff = Number(payload?.totals?.roundOff || payload?.roundOff || 0);

  const gstEnabled = payload?.gst?.enabled !== false;
  const gstType = resolveGstType({
    voucherGstType: GST_TYPES.includes(payload?.gst?.gstType) ? payload.gst.gstType : undefined,
    companyState: company?.headquarters?.state,
    partyState: party?.address?.state
  });

  const taxPack = computeVoucherTaxes({
    items: linesItems,
    charges: linesCharges,
    gstType,
    roundOff: gstEnabled ? roundOff : 0
  });

  const totals = {
    ...taxPack.totals,
    qtyIn: 0,
    qtyOut: 0,
    cogs: 0
  };

  const voucherDocPatch = {
    date,
    party: party?._id,
    referenceNumber: payload?.referenceNumber,
    narration: payload?.narration,
    currency: payload?.currency || company?.settings?.currency || 'INR',
    gst: {
      enabled: gstEnabled,
      placeOfSupplyState: payload?.gst?.placeOfSupplyState,
      gstType
    },
    lines: {
      items: taxPack.normalizedItems.map((line) => ({
        ...line,
        taxSummary: undefined
      })),
      charges: taxPack.normalizedCharges.map((line) => ({
        ...line,
        taxSummary: undefined
      })),
      journal: journalLines
    },
    totals,
    meta: {
      ...(payload?.meta || {}),
      rawPayload: payload
    }
  };

  const buildBillDueDate = () => {
    if (payload?.dueDate) {
      return parseDateOrDefault(payload.dueDate, date);
    }
    const days = Number(party?.creditDaysDefault || 0);
    const due = new Date(date);
    due.setUTCDate(due.getUTCDate() + Math.max(0, days));
    return due;
  };

  if (voucherType === 'sales_invoice') {
    if (!party?._id) throw createError(422, 'Party is required for sales invoice');
    if (!linesItems.length) throw createError(422, 'At least one item is required for sales invoice');

    stockMoves.push(
      ...buildStockMovesFromItems({
        items: taxPack.normalizedItems,
        direction: 'out',
        unitFactorLookup,
        date,
        voucherType
      })
    );

    totals.qtyOut = roundQuantity(stockMoves.reduce((sum, item) => sum + item.quantityBase, 0));

    postings.push(
      { account: party.ledgerAccount, party: party._id, debit: totals.net, credit: 0 },
      { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.SALES]._id, debit: 0, credit: totals.taxable }
    );
    addTaxPostings({ postings, taxBuckets: taxPack.taxBuckets, mode: 'output_credit', systemAccounts });

    billOps.push({
      op: 'create',
      billType: 'receivable',
      amount: totals.net,
      dueDate: buildBillDueDate()
    });
  } else if (voucherType === 'purchase_bill') {
    if (!party?._id) throw createError(422, 'Party is required for purchase bill');
    if (!linesItems.length) throw createError(422, 'At least one item is required for purchase bill');

    stockMoves.push(
      ...buildStockMovesFromItems({
        items: taxPack.normalizedItems,
        direction: 'in',
        unitFactorLookup,
        date,
        voucherType
      })
    );
    totals.qtyIn = roundQuantity(stockMoves.reduce((sum, item) => sum + item.quantityBase, 0));

    postings.push(
      { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.INVENTORY]._id, debit: totals.taxable, credit: 0 }
    );
    addTaxPostings({ postings, taxBuckets: taxPack.taxBuckets, mode: 'input_debit', systemAccounts });
    postings.push({ account: party.ledgerAccount, party: party._id, debit: 0, credit: totals.net });

    billOps.push({
      op: 'create',
      billType: 'payable',
      amount: totals.net,
      dueDate: buildBillDueDate()
    });
  } else if (voucherType === 'receipt') {
    if (!party?._id) throw createError(422, 'Party is required for receipt');
    const amount = roundMoney(payload?.amount);
    const cashBankAccount = payload?.cashBankAccount;
    if (!cashBankAccount) throw createError(422, 'cashBankAccount is required for receipt');
    if (amount <= 0) throw createError(422, 'amount must be greater than 0');

    totals.taxable = amount;
    totals.gstTotal = 0;
    totals.gross = amount;
    totals.net = amount;

    postings.push(
      { account: cashBankAccount, debit: amount, credit: 0 },
      { account: party.ledgerAccount, party: party._id, debit: 0, credit: amount }
    );

    billOps.push({
      op: 'settle',
      billType: 'receivable',
      amount
    });
  } else if (voucherType === 'payment') {
    if (!party?._id) throw createError(422, 'Party is required for payment');
    const amount = roundMoney(payload?.amount);
    const cashBankAccount = payload?.cashBankAccount;
    if (!cashBankAccount) throw createError(422, 'cashBankAccount is required for payment');
    if (amount <= 0) throw createError(422, 'amount must be greater than 0');

    totals.taxable = amount;
    totals.gstTotal = 0;
    totals.gross = amount;
    totals.net = amount;

    postings.push(
      { account: party.ledgerAccount, party: party._id, debit: amount, credit: 0 },
      { account: cashBankAccount, debit: 0, credit: amount }
    );

    billOps.push({
      op: 'settle',
      billType: 'payable',
      amount
    });
  } else if (voucherType === 'contra') {
    const amount = roundMoney(payload?.amount);
    const fromAccount = payload?.fromAccount;
    const toAccount = payload?.toAccount;
    if (!fromAccount || !toAccount) {
      throw createError(422, 'fromAccount and toAccount are required for contra voucher');
    }
    if (amount <= 0) throw createError(422, 'amount must be greater than 0');

    totals.taxable = amount;
    totals.gross = amount;
    totals.net = amount;
    postings.push(
      { account: toAccount, debit: amount, credit: 0 },
      { account: fromAccount, debit: 0, credit: amount }
    );
  } else if (voucherType === 'journal') {
    if (!journalLines.length) throw createError(422, 'journal lines are required');

    let debitTotal = 0;
    let creditTotal = 0;
    journalLines.forEach((line) => {
      const debit = roundMoney(line.drCr === 'debit' ? Number(line.amount || 0) : Number(line.debit || 0));
      const credit = roundMoney(line.drCr === 'credit' ? Number(line.amount || 0) : Number(line.credit || 0));
      if (debit > 0) debitTotal += debit;
      if (credit > 0) creditTotal += credit;
      postings.push({
        account: line.account,
        debit,
        credit
      });
    });

    debitTotal = roundMoney(debitTotal);
    creditTotal = roundMoney(creditTotal);
    if (debitTotal <= 0 || creditTotal <= 0 || debitTotal !== creditTotal) {
      throw createError(422, 'Journal voucher lines must be balanced (debit equals credit)');
    }
    totals.taxable = debitTotal;
    totals.gross = debitTotal;
    totals.net = debitTotal;
  } else if (voucherType === 'credit_note') {
    if (!party?._id) throw createError(422, 'Party is required for credit note');
    if (!linesItems.length && !linesCharges.length) {
      throw createError(422, 'Either item lines or charge lines are required for credit note');
    }

    if (linesItems.length) {
      stockMoves.push(
        ...buildStockMovesFromItems({
          items: taxPack.normalizedItems,
          direction: 'in',
          unitFactorLookup,
          date,
          voucherType
        })
      );
      totals.qtyIn = roundQuantity(stockMoves.reduce((sum, item) => sum + item.quantityBase, 0));
    }

    postings.push(
      { account: party.ledgerAccount, party: party._id, debit: 0, credit: totals.net },
      { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.SALES_RETURN]._id, debit: totals.taxable, credit: 0 }
    );
    addTaxPostings({ postings, taxBuckets: taxPack.taxBuckets, mode: 'output_debit', systemAccounts });
    billOps.push({ op: 'settle', billType: 'receivable', amount: totals.net });
  } else if (voucherType === 'debit_note') {
    if (!party?._id) throw createError(422, 'Party is required for debit note');
    if (!linesItems.length && !linesCharges.length) {
      throw createError(422, 'Either item lines or charge lines are required for debit note');
    }

    if (linesItems.length) {
      stockMoves.push(
        ...buildStockMovesFromItems({
          items: taxPack.normalizedItems,
          direction: 'out',
          unitFactorLookup,
          date,
          voucherType
        })
      );
      totals.qtyOut = roundQuantity(stockMoves.reduce((sum, item) => sum + item.quantityBase, 0));
    }

    postings.push(
      { account: party.ledgerAccount, party: party._id, debit: totals.net, credit: 0 },
      { account: systemAccounts[SYSTEM_ACCOUNT_KEYS.PURCHASE_RETURN]._id, debit: 0, credit: totals.taxable }
    );
    addTaxPostings({ postings, taxBuckets: taxPack.taxBuckets, mode: 'input_credit', systemAccounts });
    billOps.push({ op: 'settle', billType: 'payable', amount: totals.net });
  } else if (voucherType === 'delivery_challan') {
    if (!linesItems.length) {
      throw createError(422, 'At least one item line is required for delivery challan');
    }

    const stockImpact = payload?.meta?.stockImpact === 'in' ? 'in' : 'out';
    stockMoves.push(
      ...buildStockMovesFromItems({
        items: taxPack.normalizedItems,
        direction: stockImpact,
        unitFactorLookup,
        date,
        voucherType,
        meta: { stockImpact }
      })
    );

    if (stockImpact === 'in') {
      totals.qtyIn = roundQuantity(stockMoves.reduce((sum, item) => sum + item.quantityBase, 0));
    } else {
      totals.qtyOut = roundQuantity(stockMoves.reduce((sum, item) => sum + item.quantityBase, 0));
    }
    totals.taxable = 0;
    totals.gstTotal = 0;
    totals.gross = 0;
    totals.net = 0;
  } else if (voucherType === 'stock_adjustment') {
    if (!linesItems.length) {
      throw createError(422, 'At least one item line is required for stock adjustment');
    }

    linesItems.forEach((line) => {
      const adjustment = Number(line.adjustment || line.quantity || 0);
      if (!adjustment) return;

      const direction = adjustment > 0 ? 'in' : 'out';
      const quantity = Math.abs(adjustment);
      const unitFactor = resolveLineUnitFactor(line, unitFactorLookup);
      const quantityBase = roundQuantity(quantity * unitFactor);
      const rate = roundMoney(line.rate);
      const value = direction === 'in' ? roundMoney(quantity * rate) : 0;

      stockMoves.push({
        product: line.product,
        variant: line.variant,
        direction,
        quantityBase,
        displayQuantity: roundQuantity(quantity),
        displayUnit: typeof line.unit === 'string' ? line.unit : undefined,
        rate,
        value,
        date,
        voucherType
      });
    });

    totals.qtyIn = roundQuantity(
      stockMoves.filter((item) => item.direction === 'in').reduce((sum, item) => sum + item.quantityBase, 0)
    );
    totals.qtyOut = roundQuantity(
      stockMoves.filter((item) => item.direction === 'out').reduce((sum, item) => sum + item.quantityBase, 0)
    );
    totals.taxable = 0;
    totals.gstTotal = 0;
    totals.gross = 0;
    totals.net = 0;
  }

  const normalizedPostings = postings.map((posting) => ({
    account: posting.account,
    party: posting.party,
    debit: roundMoney(posting.debit),
    credit: roundMoney(posting.credit),
    meta: posting.meta || {}
  })).filter((posting) => posting.account && (posting.debit > 0 || posting.credit > 0));

  const debitTotal = roundMoney(normalizedPostings.reduce((sum, item) => sum + item.debit, 0));
  const creditTotal = roundMoney(normalizedPostings.reduce((sum, item) => sum + item.credit, 0));
  if (normalizedPostings.length && debitTotal !== creditTotal) {
    throw createError(422, `Voucher is not balanced (debit ${debitTotal} != credit ${creditTotal})`);
  }

  if (!VOUCHER_TYPES_WITH_TAX.has(voucherType)) {
    voucherDocPatch.gst = {
      enabled: false,
      gstType,
      placeOfSupplyState: payload?.gst?.placeOfSupplyState
    };
    voucherDocPatch.totals.gstTotal = 0;
    voucherDocPatch.totals.taxable = voucherDocPatch.totals.net;
    voucherDocPatch.totals.gross = voucherDocPatch.totals.net;
  }

  return {
    voucherDocPatch,
    postings: normalizedPostings,
    stockMoves,
    billOps,
    stockPostingMode: voucherType
  };
};

module.exports = {
  buildArtifacts,
  sumTaxBucket
};

