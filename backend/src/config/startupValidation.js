const createError = require('http-errors');

const REQUIRED_STORAGE_ENV_KEYS = Object.freeze(['AWS_S3_BUCKET', 'AWS_S3_REGION']);
const STORAGE_NOT_CONFIGURED_CODE = 'STORAGE_NOT_CONFIGURED';

const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;

const getMissingStorageEnvKeys = (config = {}) =>
  REQUIRED_STORAGE_ENV_KEYS.filter((key) => {
    if (key === 'AWS_S3_BUCKET') return !hasValue(config.awsS3Bucket);
    if (key === 'AWS_S3_REGION') return !hasValue(config.awsS3Region);
    return true;
  });

const assertStorageConfig = (config = {}) => {
  const missing = getMissingStorageEnvKeys(config);
  if (!missing.length) return;

  throw createError(
    503,
    `Storage is not configured. Missing required environment variables: ${missing.join(', ')}`,
    {
      code: STORAGE_NOT_CONFIGURED_CODE,
      missing
    }
  );
};

module.exports = {
  REQUIRED_STORAGE_ENV_KEYS,
  STORAGE_NOT_CONFIGURED_CODE,
  getMissingStorageEnvKeys,
  assertStorageConfig
};
