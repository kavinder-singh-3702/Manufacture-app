const { INHOUSE_COMPANY_INTERNAL_TYPE } = require('../../company/utils/inhouseCatalog.util');

const PURCHASE_PAYMENT_MODES = Object.freeze(['none', 'full_prepay']);
const PURCHASE_PROVIDERS = Object.freeze(['none', 'razorpay']);
const CHECKOUT_REASONS = Object.freeze(['not_inhouse', 'prepaid_disabled', 'inactive']);

const DEFAULT_PURCHASE_OPTIONS = Object.freeze({
  prepaidEnabled: false,
  paymentMode: 'none',
  provider: 'none'
});

const mapToObject = (value) => (value instanceof Map ? Object.fromEntries(value) : value);

const normalizePurchaseOptionsInput = (value) => {
  const prepaidEnabled = Boolean(value?.prepaidEnabled);
  if (!prepaidEnabled) {
    return { ...DEFAULT_PURCHASE_OPTIONS };
  }

  return {
    prepaidEnabled: true,
    paymentMode: 'full_prepay',
    provider: 'razorpay'
  };
};

const getCompanyMetadata = (company) => {
  const metadata = mapToObject(company?.metadata);
  return metadata && typeof metadata === 'object' ? metadata : {};
};

const isInhouseCatalogProduct = (product) => {
  return getCompanyMetadata(product?.company)?.internalType === INHOUSE_COMPANY_INTERNAL_TYPE;
};

const computePurchaseOptionsState = (product) => {
  const normalized = normalizePurchaseOptionsInput(product?.purchaseOptions);

  let checkoutEligible = false;
  let checkoutReason;

  if (!isInhouseCatalogProduct(product)) {
    checkoutReason = 'not_inhouse';
  } else if (product?.status !== 'active' || product?.visibility !== 'public' || product?.deletedAt) {
    checkoutReason = 'inactive';
  } else if (!normalized.prepaidEnabled || normalized.paymentMode !== 'full_prepay' || normalized.provider !== 'razorpay') {
    checkoutReason = 'prepaid_disabled';
  } else {
    checkoutEligible = true;
  }

  return {
    ...normalized,
    checkoutEligible,
    ...(checkoutEligible ? {} : { checkoutReason })
  };
};

module.exports = {
  PURCHASE_PAYMENT_MODES,
  PURCHASE_PROVIDERS,
  CHECKOUT_REASONS,
  DEFAULT_PURCHASE_OPTIONS,
  mapToObject,
  normalizePurchaseOptionsInput,
  getCompanyMetadata,
  isInhouseCatalogProduct,
  computePurchaseOptionsState
};
