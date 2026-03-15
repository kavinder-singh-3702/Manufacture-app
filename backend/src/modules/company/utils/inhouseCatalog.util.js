const INHOUSE_COMPANY_INTERNAL_TYPE = 'inhouse_catalog';
const INHOUSE_COMPANY_SLUG = 'arvann-inhouse-catalog';

const INHOUSE_COMPANY_QUERY = {
  'metadata.internalType': INHOUSE_COMPANY_INTERNAL_TYPE
};

const INHOUSE_COMPANY_EXCLUDE_QUERY = {
  'metadata.internalType': { $ne: INHOUSE_COMPANY_INTERNAL_TYPE }
};

const buildInhouseCompanyMetadata = (existing = {}) => ({
  ...existing,
  internalType: INHOUSE_COMPANY_INTERNAL_TYPE,
  hidden: true,
  system: {
    ...(existing?.system || {}),
    inhouseCatalog: true,
    hiddenFromSwitcher: true
  }
});

module.exports = {
  INHOUSE_COMPANY_INTERNAL_TYPE,
  INHOUSE_COMPANY_SLUG,
  INHOUSE_COMPANY_QUERY,
  INHOUSE_COMPANY_EXCLUDE_QUERY,
  buildInhouseCompanyMetadata
};
