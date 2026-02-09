const AccountingSequence = require('../../../models/accountingSequence.model');
const { VOUCHER_PREFIX_BY_TYPE } = require('../../../constants/accounting');
const { getFiscalYearKey } = require('./fiscalYear.service');

const reserveVoucherNumber = async ({
  companyId,
  voucherType,
  date,
  fiscalYearStartMonth = 3,
  session
}) => {
  const fiscalYearKey = getFiscalYearKey(date, fiscalYearStartMonth);

  const sequence = await AccountingSequence.findOneAndUpdate(
    { company: companyId, fiscalYearKey, voucherType },
    [
      {
        $set: {
          company: companyId,
          fiscalYearKey,
          voucherType,
          prefix: { $ifNull: ['$prefix', VOUCHER_PREFIX_BY_TYPE[voucherType] || 'VC-'] },
          padding: { $ifNull: ['$padding', 5] },
          // Keep nextNumber as "next to allocate", so the reserved number is nextNumber - 1.
          nextNumber: { $add: [{ $ifNull: ['$nextNumber', 1] }, 1] }
        }
      }
    ],
    {
      upsert: true,
      new: true,
      session
    }
  );

  const sequenceNumber = Math.max(1, Number(sequence.nextNumber || 1) - 1);
  const voucherNumber = `${sequence.prefix || ''}${String(sequenceNumber).padStart(sequence.padding || 5, '0')}`;

  return {
    fiscalYearKey,
    sequenceNumber,
    voucherNumber
  };
};

module.exports = {
  reserveVoucherNumber
};
