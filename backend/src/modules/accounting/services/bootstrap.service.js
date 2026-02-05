const Company = require('../../../models/company.model');
const Account = require('../../../models/account.model');
const Unit = require('../../../models/unit.model');
const AccountingSequence = require('../../../models/accountingSequence.model');
const {
  SYSTEM_ACCOUNTS,
  VOUCHER_TYPES,
  VOUCHER_PREFIX_BY_TYPE
} = require('../../../constants/accounting');
const { getFiscalYearKey } = require('./fiscalYear.service');

const ensureAccountingSetup = async (companyId, { session, asOfDate = new Date() } = {}) => {
  const company = await Company.findById(companyId).session(session);
  if (!company) {
    return null;
  }

  const fiscalYearStartMonth = Number.isInteger(company?.settings?.fiscalYearStartMonth)
    ? company.settings.fiscalYearStartMonth
    : 3;
  const fiscalYearKey = getFiscalYearKey(asOfDate, fiscalYearStartMonth);

  for (const definition of SYSTEM_ACCOUNTS) {
    await Account.findOneAndUpdate(
      { company: companyId, key: definition.key },
      {
        $set: {
          name: definition.name,
          type: definition.type,
          group: definition.group,
          isSystem: true,
          deletedAt: undefined
        },
        $setOnInsert: {
          company: companyId
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, session }
    );
  }

  const defaultUnit = await Unit.findOneAndUpdate(
    { company: companyId, name: 'pcs' },
    {
      $set: {
        symbol: 'pcs',
        decimals: 0,
        conversionFactorToBase: 1,
        deletedAt: undefined
      },
      $setOnInsert: {
        company: companyId
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );

  for (const voucherType of VOUCHER_TYPES) {
    await AccountingSequence.findOneAndUpdate(
      { company: companyId, fiscalYearKey, voucherType },
      {
        $setOnInsert: {
          company: companyId,
          fiscalYearKey,
          voucherType,
          prefix: VOUCHER_PREFIX_BY_TYPE[voucherType] || 'VC-',
          padding: 5,
          nextNumber: 1
        }
      },
      { upsert: true, setDefaultsOnInsert: true, session }
    );
  }

  const systemAccounts = await Account.find({
    company: companyId,
    key: { $in: SYSTEM_ACCOUNTS.map((item) => item.key) },
    deletedAt: { $exists: false }
  }).session(session);

  const systemAccountsByKey = systemAccounts.reduce((acc, account) => {
    acc[account.key] = account;
    return acc;
  }, {});

  return {
    company,
    fiscalYearStartMonth,
    fiscalYearKey,
    defaultUnit,
    systemAccountsByKey
  };
};

module.exports = {
  ensureAccountingSetup
};

