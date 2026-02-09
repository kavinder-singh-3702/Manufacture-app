const AccountingVoucher = require('../../../models/accountingVoucher.model');
const LedgerPosting = require('../../../models/ledgerPosting.model');
const AccountingBill = require('../../../models/accountingBill.model');
const InventoryBalance = require('../../../models/inventoryBalance.model');
const StockMove = require('../../../models/stockMove.model');
const Account = require('../../../models/account.model');
const Product = require('../../../models/product.model');
const {
  SYSTEM_ACCOUNT_KEYS
} = require('../../../constants/accounting');
const { roundMoney, parseDateOrDefault } = require('./helpers');

const MAX_LIMIT = 100;

const buildDateFilter = (from, to) => {
  if (!from && !to) return undefined;
  const filter = {};
  if (from) filter.$gte = parseDateOrDefault(from);
  if (to) filter.$lte = parseDateOrDefault(to);
  return filter;
};

const dashboard = async (companyId, { from, to } = {}) => {
  const dateFilter = buildDateFilter(from, to);
  const voucherMatch = {
    company: companyId,
    status: 'posted'
  };
  if (dateFilter) voucherMatch.date = dateFilter;

  const [voucherStats, receivable, payable, stockValueAgg, lowStockProducts, topItems, recentVouchers, cashBankAccounts, cashBankLedger] =
    await Promise.all([
      AccountingVoucher.aggregate([
        { $match: voucherMatch },
        {
          $group: {
            _id: '$voucherType',
            net: { $sum: '$totals.net' },
            cogs: { $sum: '$totals.cogs' }
          }
        }
      ]),
      AccountingBill.aggregate([
        { $match: { company: companyId, billType: 'receivable', status: 'open', isVoided: { $ne: true } } },
        { $group: { _id: null, balance: { $sum: '$balanceAmount' } } }
      ]),
      AccountingBill.aggregate([
        { $match: { company: companyId, billType: 'payable', status: 'open', isVoided: { $ne: true } } },
        { $group: { _id: null, balance: { $sum: '$balanceAmount' } } }
      ]),
      InventoryBalance.aggregate([
        { $match: { company: companyId } },
        { $group: { _id: null, totalValue: { $sum: '$onHandValue' }, totalQty: { $sum: '$onHandQtyBase' } } }
      ]),
      Product.find({
        company: companyId,
        deletedAt: { $exists: false },
        $expr: { $lte: ['$availableQuantity', '$minStockQuantity'] }
      })
        .select('name availableQuantity minStockQuantity')
        .sort({ availableQuantity: 1 })
        .limit(10)
        .lean(),
      StockMove.aggregate([
        {
          $match: {
            company: companyId,
            isVoided: { $ne: true },
            ...(dateFilter ? { date: dateFilter } : {}),
            direction: 'out'
          }
        },
        {
          $group: {
            _id: { product: '$product', variant: '$variant' },
            qtyOut: { $sum: '$quantityBase' },
            costValue: { $sum: '$costValue' }
          }
        },
        { $sort: { qtyOut: -1 } },
        { $limit: 10 }
      ]),
      AccountingVoucher.find(voucherMatch)
        .select('_id voucherType status date voucherNumber party totals.net')
        .populate('party', 'name')
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .lean(),
      Account.find({
        company: companyId,
        key: { $in: [SYSTEM_ACCOUNT_KEYS.CASH, SYSTEM_ACCOUNT_KEYS.BANK] },
        deletedAt: { $exists: false }
      })
        .select('_id key name')
        .lean(),
      LedgerPosting.aggregate([
        {
          $match: {
            company: companyId,
            isVoided: { $ne: true },
            ...(to ? { date: { $lte: parseDateOrDefault(to) } } : {})
          }
        },
        {
          $group: {
            _id: '$account',
            debit: { $sum: '$debit' },
            credit: { $sum: '$credit' }
          }
        }
      ])
    ]);

  const voucherMap = voucherStats.reduce((acc, item) => {
    acc[item._id] = item;
    return acc;
  }, {});

  const sales = roundMoney(voucherMap.sales_invoice?.net || 0);
  const purchases = roundMoney(voucherMap.purchase_bill?.net || 0);
  const receipts = roundMoney(voucherMap.receipt?.net || 0);
  const payments = roundMoney(voucherMap.payment?.net || 0);
  const cogs = roundMoney(voucherMap.sales_invoice?.cogs || 0);
  const grossProfit = roundMoney(sales - cogs);

  const cashBankAccountIds = new Set(cashBankAccounts.map((item) => item._id.toString()));
  const cashBalance = roundMoney(
    cashBankLedger
      .filter((item) => cashBankAccountIds.has(item._id?.toString()))
      .reduce((sum, item) => sum + Number(item.debit || 0) - Number(item.credit || 0), 0)
  );

  const stockValue = stockValueAgg[0] || { totalValue: 0, totalQty: 0 };

  const productIds = [
    ...new Set(
      (topItems || [])
        .map((item) => item?._id?.product)
        .filter(Boolean)
        .map((id) => id.toString())
    )
  ];
  const productsById = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).select('_id name').lean()
    : [];
  const productNameLookup = productsById.reduce((acc, product) => {
    acc[product._id.toString()] = product.name;
    return acc;
  }, {});
  const enrichedTopItems = (topItems || []).map((item) => {
    const productId = item?._id?.product ? item._id.product.toString() : '';
    return {
      ...item,
      productName: productNameLookup[productId]
    };
  });

  return {
    sales,
    purchases,
    receipts,
    payments,
    cogs,
    grossProfit,
    receivables: roundMoney(receivable[0]?.balance || 0),
    payables: roundMoney(payable[0]?.balance || 0),
    cashBalance,
    stockValue: roundMoney(stockValue.totalValue || 0),
    stockQuantity: Number(stockValue.totalQty || 0),
    recentVouchers,
    lowStockProducts,
    topItems: enrichedTopItems
  };
};

const trialBalance = async (companyId, { from, to } = {}) => {
  const fromDate = from ? parseDateOrDefault(from) : null;
  const dateFilter = buildDateFilter(from, to);

  const accounts = await Account.find({
    company: companyId,
    deletedAt: { $exists: false }
  })
    .sort({ name: 1 })
    .lean();

  const [beforeAgg, periodAgg] = await Promise.all([
    fromDate
      ? LedgerPosting.aggregate([
          { $match: { company: companyId, isVoided: { $ne: true }, date: { $lt: fromDate } } },
          { $group: { _id: '$account', debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } }
        ])
      : [],
    LedgerPosting.aggregate([
      { $match: { company: companyId, isVoided: { $ne: true }, ...(dateFilter ? { date: dateFilter } : {}) } },
      { $group: { _id: '$account', debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } }
    ])
  ]);

  const beforeMap = beforeAgg.reduce((acc, item) => {
    acc[item._id.toString()] = item;
    return acc;
  }, {});
  const periodMap = periodAgg.reduce((acc, item) => {
    acc[item._id.toString()] = item;
    return acc;
  }, {});

  const rows = accounts.map((account) => {
    const before = beforeMap[account._id.toString()] || { debit: 0, credit: 0 };
    const period = periodMap[account._id.toString()] || { debit: 0, credit: 0 };
    const openingFromMaster =
      account.openingBalance?.drCr === 'credit'
        ? -Number(account.openingBalance?.amount || 0)
        : Number(account.openingBalance?.amount || 0);
    const opening = roundMoney(openingFromMaster + Number(before.debit || 0) - Number(before.credit || 0));
    const periodDebit = roundMoney(period.debit || 0);
    const periodCredit = roundMoney(period.credit || 0);
    const closing = roundMoney(opening + periodDebit - periodCredit);

    return {
      accountId: account._id.toString(),
      accountName: account.name,
      accountType: account.type,
      group: account.group,
      opening,
      periodDebit,
      periodCredit,
      closing
    };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      opening: roundMoney(acc.opening + row.opening),
      periodDebit: roundMoney(acc.periodDebit + row.periodDebit),
      periodCredit: roundMoney(acc.periodCredit + row.periodCredit),
      closing: roundMoney(acc.closing + row.closing)
    }),
    { opening: 0, periodDebit: 0, periodCredit: 0, closing: 0 }
  );

  return {
    rows,
    totals
  };
};

const profitAndLoss = async (companyId, { from, to } = {}) => {
  const dateFilter = buildDateFilter(from, to);
  const accounts = await Account.find({
    company: companyId,
    type: { $in: ['income', 'expense'] },
    deletedAt: { $exists: false }
  })
    .select('_id name type group')
    .lean();

  const postingAgg = await LedgerPosting.aggregate([
    { $match: { company: companyId, isVoided: { $ne: true }, ...(dateFilter ? { date: dateFilter } : {}) } },
    { $group: { _id: '$account', debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } }
  ]);

  const postingMap = postingAgg.reduce((acc, item) => {
    acc[item._id.toString()] = item;
    return acc;
  }, {});

  const incomeRows = [];
  const expenseRows = [];
  accounts.forEach((account) => {
    const posting = postingMap[account._id.toString()] || { debit: 0, credit: 0 };
    if (account.type === 'income') {
      const value = roundMoney(Number(posting.credit || 0) - Number(posting.debit || 0));
      incomeRows.push({ accountId: account._id.toString(), accountName: account.name, value });
    } else {
      const value = roundMoney(Number(posting.debit || 0) - Number(posting.credit || 0));
      expenseRows.push({ accountId: account._id.toString(), accountName: account.name, value });
    }
  });

  const totalIncome = roundMoney(incomeRows.reduce((sum, row) => sum + row.value, 0));
  const totalExpense = roundMoney(expenseRows.reduce((sum, row) => sum + row.value, 0));

  return {
    income: incomeRows,
    expenses: expenseRows,
    totalIncome,
    totalExpense,
    netProfit: roundMoney(totalIncome - totalExpense)
  };
};

const gstSummary = async (companyId, { from, to } = {}) => {
  const dateFilter = buildDateFilter(from, to);
  const gstAccounts = await Account.find({
    company: companyId,
    key: {
      $in: [
        SYSTEM_ACCOUNT_KEYS.INPUT_CGST,
        SYSTEM_ACCOUNT_KEYS.INPUT_SGST,
        SYSTEM_ACCOUNT_KEYS.INPUT_IGST,
        SYSTEM_ACCOUNT_KEYS.OUTPUT_CGST,
        SYSTEM_ACCOUNT_KEYS.OUTPUT_SGST,
        SYSTEM_ACCOUNT_KEYS.OUTPUT_IGST
      ]
    },
    deletedAt: { $exists: false }
  })
    .select('_id key')
    .lean();

  const postings = await LedgerPosting.aggregate([
    {
      $match: {
        company: companyId,
        account: { $in: gstAccounts.map((item) => item._id) },
        isVoided: { $ne: true },
        ...(dateFilter ? { date: dateFilter } : {})
      }
    },
    {
      $group: {
        _id: '$account',
        debit: { $sum: '$debit' },
        credit: { $sum: '$credit' }
      }
    }
  ]);

  const postingMap = postings.reduce((acc, item) => {
    acc[item._id.toString()] = item;
    return acc;
  }, {});
  const accountKeyMap = gstAccounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.key;
    return acc;
  }, {});

  const output = { cgst: 0, sgst: 0, igst: 0 };
  const input = { cgst: 0, sgst: 0, igst: 0 };

  Object.entries(postingMap).forEach(([accountId, posting]) => {
    const key = accountKeyMap[accountId];
    const netDebit = roundMoney(Number(posting.debit || 0) - Number(posting.credit || 0));
    const netCredit = roundMoney(Number(posting.credit || 0) - Number(posting.debit || 0));
    if (key === SYSTEM_ACCOUNT_KEYS.INPUT_CGST) input.cgst = netDebit;
    if (key === SYSTEM_ACCOUNT_KEYS.INPUT_SGST) input.sgst = netDebit;
    if (key === SYSTEM_ACCOUNT_KEYS.INPUT_IGST) input.igst = netDebit;
    if (key === SYSTEM_ACCOUNT_KEYS.OUTPUT_CGST) output.cgst = netCredit;
    if (key === SYSTEM_ACCOUNT_KEYS.OUTPUT_SGST) output.sgst = netCredit;
    if (key === SYSTEM_ACCOUNT_KEYS.OUTPUT_IGST) output.igst = netCredit;
  });

  return {
    input,
    output,
    netPayable: roundMoney(output.cgst + output.sgst + output.igst - (input.cgst + input.sgst + input.igst))
  };
};

const partyOutstanding = async (companyId, { asOf, type = 'customer' } = {}) => {
  const asOfDate = asOf ? parseDateOrDefault(asOf) : new Date();
  const billType = type === 'supplier' ? 'payable' : 'receivable';

  const bills = await AccountingBill.find({
    company: companyId,
    billType,
    status: 'open',
    isVoided: { $ne: true }
  })
    .populate('party', 'name')
    .lean();

  const partyMap = {};
  bills.forEach((bill) => {
    const partyId = bill.party?._id?.toString() || bill.party?.toString() || 'unknown';
    if (!partyMap[partyId]) {
      partyMap[partyId] = {
        partyId,
        partyName: bill.party?.name || 'Unknown',
        totalOutstanding: 0,
        aging: { bucket_0_30: 0, bucket_31_60: 0, bucket_61_90: 0, bucket_90_plus: 0 }
      };
    }
    const balance = roundMoney(bill.balanceAmount || 0);
    partyMap[partyId].totalOutstanding = roundMoney(partyMap[partyId].totalOutstanding + balance);

    const dueDate = bill.dueDate || bill.billDate || bill.createdAt;
    const overdueDays = Math.max(0, Math.floor((asOfDate.getTime() - new Date(dueDate).getTime()) / (24 * 60 * 60 * 1000)));
    if (overdueDays <= 30) partyMap[partyId].aging.bucket_0_30 = roundMoney(partyMap[partyId].aging.bucket_0_30 + balance);
    else if (overdueDays <= 60) partyMap[partyId].aging.bucket_31_60 = roundMoney(partyMap[partyId].aging.bucket_31_60 + balance);
    else if (overdueDays <= 90) partyMap[partyId].aging.bucket_61_90 = roundMoney(partyMap[partyId].aging.bucket_61_90 + balance);
    else partyMap[partyId].aging.bucket_90_plus = roundMoney(partyMap[partyId].aging.bucket_90_plus + balance);
  });

  const rows = Object.values(partyMap).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  const totalOutstanding = roundMoney(rows.reduce((sum, row) => sum + row.totalOutstanding, 0));

  return {
    type: billType,
    asOf: asOfDate,
    rows,
    totalOutstanding
  };
};

const stockSummary = async (companyId, { from, to, level = 'variant' } = {}) => {
  const dateFilter = buildDateFilter(from, to);
  const groupId = level === 'product' ? { product: '$product' } : { product: '$product', variant: '$variant' };

  const [periodMoves, closingBalances] = await Promise.all([
    StockMove.aggregate([
      {
        $match: {
          company: companyId,
          isVoided: { $ne: true },
          ...(dateFilter ? { date: dateFilter } : {})
        }
      },
      {
        $group: {
          _id: groupId,
          qtyIn: {
            $sum: {
              $cond: [{ $eq: ['$direction', 'in'] }, '$quantityBase', 0]
            }
          },
          qtyOut: {
            $sum: {
              $cond: [{ $eq: ['$direction', 'out'] }, '$quantityBase', 0]
            }
          },
          valueIn: {
            $sum: {
              $cond: [{ $eq: ['$direction', 'in'] }, '$value', 0]
            }
          },
          valueOut: {
            $sum: {
              $cond: [{ $eq: ['$direction', 'out'] }, '$costValue', 0]
            }
          }
        }
      }
    ]),
    InventoryBalance.aggregate([
      { $match: { company: companyId } },
      {
        $group: {
          _id: level === 'product' ? { product: '$product' } : { product: '$product', variant: '$variant' },
          closingQty: { $sum: '$onHandQtyBase' },
          closingValue: { $sum: '$onHandValue' }
        }
      }
    ])
  ]);

  const periodMap = periodMoves.reduce((acc, row) => {
    acc[JSON.stringify(row._id)] = row;
    return acc;
  }, {});
  const closingMap = closingBalances.reduce((acc, row) => {
    acc[JSON.stringify(row._id)] = row;
    return acc;
  }, {});

  const keys = new Set([...Object.keys(periodMap), ...Object.keys(closingMap)]);
  const rows = [...keys].map((key) => {
    const period = periodMap[key] || { qtyIn: 0, qtyOut: 0, valueIn: 0, valueOut: 0, _id: {} };
    const closing = closingMap[key] || { closingQty: 0, closingValue: 0 };

    const openingQty = roundMoney(Number(closing.closingQty || 0) - (Number(period.qtyIn || 0) - Number(period.qtyOut || 0)));
    const openingValue = roundMoney(
      Number(closing.closingValue || 0) - (Number(period.valueIn || 0) - Number(period.valueOut || 0))
    );

    return {
      ...period._id,
      openingQty,
      openingValue,
      qtyIn: roundMoney(period.qtyIn || 0),
      qtyOut: roundMoney(period.qtyOut || 0),
      valueIn: roundMoney(period.valueIn || 0),
      valueOut: roundMoney(period.valueOut || 0),
      closingQty: roundMoney(closing.closingQty || 0),
      closingValue: roundMoney(closing.closingValue || 0)
    };
  });

  return {
    level,
    rows
  };
};

const stockLedger = async (
  companyId,
  { productId, variantId, from, to, limit = 50, offset = 0 } = {}
) => {
  const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
  const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
  const cappedLimit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);

  const dateFilter = buildDateFilter(from, to);
  const query = {
    company: companyId,
    isVoided: { $ne: true }
  };
  if (productId) query.product = productId;
  if (variantId) query.variant = variantId;
  if (dateFilter) query.date = dateFilter;

  const [rows, total] = await Promise.all([
    StockMove.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(parsedOffset)
      .limit(cappedLimit)
      .lean(),
    StockMove.countDocuments(query)
  ]);

  return {
    rows,
    pagination: {
      total,
      limit: cappedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + rows.length < total
    }
  };
};

const ledgerReport = async (companyId, accountId, { from, to, limit = 100, offset = 0 } = {}) => {
  const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 100;
  const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
  const cappedLimit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);
  const fromDate = from ? parseDateOrDefault(from) : null;
  const dateFilter = buildDateFilter(from, to);

  const [opening, rows, total] = await Promise.all([
    fromDate
      ? LedgerPosting.aggregate([
          {
            $match: {
              company: companyId,
              account: accountId,
              isVoided: { $ne: true },
              date: { $lt: fromDate }
            }
          },
          { $group: { _id: null, opening: { $sum: { $subtract: ['$debit', '$credit'] } } } }
        ])
      : [],
    LedgerPosting.find({
      company: companyId,
      account: accountId,
      isVoided: { $ne: true },
      ...(dateFilter ? { date: dateFilter } : {})
    })
      .sort({ date: 1, createdAt: 1 })
      .skip(parsedOffset)
      .limit(cappedLimit)
      .lean(),
    LedgerPosting.countDocuments({
      company: companyId,
      account: accountId,
      isVoided: { $ne: true },
      ...(dateFilter ? { date: dateFilter } : {})
    })
  ]);

  let running = roundMoney(opening[0]?.opening || 0);
  const normalizedRows = rows.map((row) => {
    running = roundMoney(running + Number(row.debit || 0) - Number(row.credit || 0));
    return {
      ...row,
      runningBalance: running
    };
  });

  return {
    openingBalance: roundMoney(opening[0]?.opening || 0),
    rows: normalizedRows,
    pagination: {
      total,
      limit: cappedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + rows.length < total
    }
  };
};

module.exports = {
  dashboard,
  trialBalance,
  profitAndLoss,
  gstSummary,
  partyOutstanding,
  stockSummary,
  stockLedger,
  ledgerReport
};
