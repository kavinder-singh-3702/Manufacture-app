const { GST_TYPES } = require('../../../constants/accounting');
const { roundMoney, ensureArray } = require('./helpers');

const normalizeState = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const resolveGstType = ({ voucherGstType, companyState, partyState } = {}) => {
  if (GST_TYPES.includes(voucherGstType)) {
    return voucherGstType;
  }

  const normalizedCompanyState = normalizeState(companyState);
  const normalizedPartyState = normalizeState(partyState);

  if (!normalizedCompanyState || !normalizedPartyState) {
    return 'cgst_sgst';
  }

  return normalizedCompanyState === normalizedPartyState ? 'cgst_sgst' : 'igst';
};

const normalizeLineAmount = (line) => {
  const quantity = Number(line?.quantity || 0);
  const rate = Number(line?.rate || 0);
  const discountAmount = Number(line?.discountAmount || 0);
  const explicitAmount = Number(line?.amount);

  if (!Number.isNaN(explicitAmount) && explicitAmount > 0) {
    return roundMoney(explicitAmount);
  }

  return roundMoney(Math.max(0, quantity * rate - discountAmount));
};

const computeLineTax = ({ amount, taxRate = 0, gstType = 'cgst_sgst' } = {}) => {
  const taxable = roundMoney(amount);
  const rate = Number(taxRate || 0);
  const taxAmount = roundMoney((taxable * rate) / 100);

  if (gstType === 'igst') {
    return {
      gstType: 'igst',
      taxable,
      taxAmount,
      cgst: 0,
      sgst: 0,
      igst: taxAmount
    };
  }

  const halfTax = roundMoney(taxAmount / 2);
  return {
    gstType: 'cgst_sgst',
    taxable,
    taxAmount,
    cgst: halfTax,
    sgst: roundMoney(taxAmount - halfTax),
    igst: 0
  };
};

const computeVoucherTaxes = ({ items, charges, gstType, roundOff = 0 } = {}) => {
  const normalizedItems = ensureArray(items).map((line) => {
    const amount = normalizeLineAmount(line);
    const lineGstType = resolveGstType({
      voucherGstType: line?.tax?.gstType || gstType
    });
    const tax = computeLineTax({
      amount,
      taxRate: Number(line?.tax?.gstRate || 0),
      gstType: lineGstType
    });
    return {
      ...line,
      amount,
      tax: {
        ...(line.tax || {}),
        gstType: lineGstType,
        gstRate: Number(line?.tax?.gstRate || 0),
        taxAmount: tax.taxAmount
      },
      taxSummary: tax
    };
  });

  const normalizedCharges = ensureArray(charges).map((line) => {
    const amount = roundMoney(Number(line?.amount || 0));
    const lineGstType = resolveGstType({
      voucherGstType: line?.tax?.gstType || gstType
    });
    const tax = computeLineTax({
      amount,
      taxRate: Number(line?.tax?.gstRate || 0),
      gstType: lineGstType
    });

    return {
      ...line,
      amount,
      tax: {
        ...(line.tax || {}),
        gstType: lineGstType,
        gstRate: Number(line?.tax?.gstRate || 0),
        taxAmount: tax.taxAmount
      },
      taxSummary: tax
    };
  });

  const allLineSummaries = [...normalizedItems, ...normalizedCharges].map((line) => line.taxSummary);
  const taxable = roundMoney(allLineSummaries.reduce((sum, line) => sum + Number(line.taxable || 0), 0));
  const gstTotal = roundMoney(allLineSummaries.reduce((sum, line) => sum + Number(line.taxAmount || 0), 0));
  const gross = roundMoney(taxable + gstTotal);
  const roundOffValue = roundMoney(roundOff);
  const net = roundMoney(gross + roundOffValue);

  const taxBuckets = {
    cgst: roundMoney(allLineSummaries.reduce((sum, line) => sum + Number(line.cgst || 0), 0)),
    sgst: roundMoney(allLineSummaries.reduce((sum, line) => sum + Number(line.sgst || 0), 0)),
    igst: roundMoney(allLineSummaries.reduce((sum, line) => sum + Number(line.igst || 0), 0))
  };

  return {
    normalizedItems,
    normalizedCharges,
    taxBuckets,
    totals: {
      taxable,
      gstTotal,
      gross,
      roundOff: roundOffValue,
      net
    }
  };
};

module.exports = {
  resolveGstType,
  normalizeLineAmount,
  computeLineTax,
  computeVoucherTaxes
};

