const VOUCHER_TYPES = Object.freeze([
  'sales_invoice',
  'purchase_bill',
  'receipt',
  'payment',
  'contra',
  'journal',
  'credit_note',
  'debit_note',
  'delivery_challan',
  'stock_adjustment'
]);

const VOUCHER_STATUSES = Object.freeze(['draft', 'posted', 'voided']);

const GST_TYPES = Object.freeze(['cgst_sgst', 'igst']);

const ACCOUNT_TYPES = Object.freeze(['asset', 'liability', 'equity', 'income', 'expense']);

const ACCOUNT_DR_CR = Object.freeze(['debit', 'credit']);

const PARTY_TYPES = Object.freeze(['customer', 'supplier', 'both']);

const BILL_TYPES = Object.freeze(['receivable', 'payable']);
const BILL_STATUSES = Object.freeze(['open', 'closed', 'voided']);

const STOCK_DIRECTIONS = Object.freeze(['in', 'out']);

const VOUCHER_LOG_ACTIONS = Object.freeze(['created', 'updated', 'posted', 'voided']);

const SYSTEM_ACCOUNT_KEYS = Object.freeze({
  CASH: 'cash',
  BANK: 'bank',
  SALES: 'sales',
  SALES_RETURN: 'sales_return',
  PURCHASES: 'purchases',
  PURCHASE_RETURN: 'purchase_return',
  INVENTORY: 'inventory',
  COGS: 'cogs',
  ROUND_OFF: 'round_off',
  FREIGHT: 'freight',
  INVENTORY_ADJUSTMENT: 'inventory_adjustment',
  INPUT_CGST: 'input_cgst',
  INPUT_SGST: 'input_sgst',
  INPUT_IGST: 'input_igst',
  OUTPUT_CGST: 'output_cgst',
  OUTPUT_SGST: 'output_sgst',
  OUTPUT_IGST: 'output_igst'
});

const SYSTEM_ACCOUNTS = Object.freeze([
  { key: SYSTEM_ACCOUNT_KEYS.CASH, name: 'Cash', type: 'asset', group: 'cash' },
  { key: SYSTEM_ACCOUNT_KEYS.BANK, name: 'Bank', type: 'asset', group: 'bank' },
  { key: SYSTEM_ACCOUNT_KEYS.SALES, name: 'Sales', type: 'income', group: 'sales' },
  { key: SYSTEM_ACCOUNT_KEYS.SALES_RETURN, name: 'Sales Return', type: 'expense', group: 'sales_return' },
  { key: SYSTEM_ACCOUNT_KEYS.PURCHASES, name: 'Purchases', type: 'expense', group: 'purchases' },
  { key: SYSTEM_ACCOUNT_KEYS.PURCHASE_RETURN, name: 'Purchase Return', type: 'income', group: 'purchase_return' },
  { key: SYSTEM_ACCOUNT_KEYS.INVENTORY, name: 'Inventory', type: 'asset', group: 'inventory' },
  { key: SYSTEM_ACCOUNT_KEYS.COGS, name: 'Cost Of Goods Sold', type: 'expense', group: 'cogs' },
  { key: SYSTEM_ACCOUNT_KEYS.ROUND_OFF, name: 'Round Off', type: 'expense', group: 'round_off' },
  { key: SYSTEM_ACCOUNT_KEYS.FREIGHT, name: 'Freight Charges', type: 'expense', group: 'freight' },
  {
    key: SYSTEM_ACCOUNT_KEYS.INVENTORY_ADJUSTMENT,
    name: 'Inventory Adjustment',
    type: 'expense',
    group: 'inventory_adjustment'
  },
  { key: SYSTEM_ACCOUNT_KEYS.INPUT_CGST, name: 'Input CGST', type: 'asset', group: 'tax_input' },
  { key: SYSTEM_ACCOUNT_KEYS.INPUT_SGST, name: 'Input SGST', type: 'asset', group: 'tax_input' },
  { key: SYSTEM_ACCOUNT_KEYS.INPUT_IGST, name: 'Input IGST', type: 'asset', group: 'tax_input' },
  { key: SYSTEM_ACCOUNT_KEYS.OUTPUT_CGST, name: 'Output CGST', type: 'liability', group: 'tax_output' },
  { key: SYSTEM_ACCOUNT_KEYS.OUTPUT_SGST, name: 'Output SGST', type: 'liability', group: 'tax_output' },
  { key: SYSTEM_ACCOUNT_KEYS.OUTPUT_IGST, name: 'Output IGST', type: 'liability', group: 'tax_output' }
]);

const VOUCHER_PREFIX_BY_TYPE = Object.freeze({
  sales_invoice: 'SI-',
  purchase_bill: 'PB-',
  receipt: 'RC-',
  payment: 'PM-',
  contra: 'CT-',
  journal: 'JR-',
  credit_note: 'CN-',
  debit_note: 'DN-',
  delivery_challan: 'DC-',
  stock_adjustment: 'SA-'
});

module.exports = {
  VOUCHER_TYPES,
  VOUCHER_STATUSES,
  GST_TYPES,
  ACCOUNT_TYPES,
  ACCOUNT_DR_CR,
  PARTY_TYPES,
  BILL_TYPES,
  BILL_STATUSES,
  STOCK_DIRECTIONS,
  VOUCHER_LOG_ACTIONS,
  SYSTEM_ACCOUNT_KEYS,
  SYSTEM_ACCOUNTS,
  VOUCHER_PREFIX_BY_TYPE
};

