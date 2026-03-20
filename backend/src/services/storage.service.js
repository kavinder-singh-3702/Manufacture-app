const createError = require('http-errors');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config/env');
const { assertStorageConfig, STORAGE_NOT_CONFIGURED_CODE } = require('../config/startupValidation');

const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB guardrail for compliance files.
const STORAGE_ERROR_CODES = Object.freeze({
  NOT_CONFIGURED: STORAGE_NOT_CONFIGURED_CODE,
  ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
  INVALID_CREDENTIALS: 'STORAGE_INVALID_CREDENTIALS',
  REGION_MISMATCH: 'STORAGE_REGION_MISMATCH',
  BUCKET_NOT_FOUND: 'STORAGE_BUCKET_NOT_FOUND',
  UPLOAD_FAILED: 'STORAGE_UPLOAD_FAILED'
});

let s3Client;

const getS3Client = () => {
  assertStorageConfig(config);

  if (!s3Client) {
    const clientConfig = {};

    if (config.awsS3Region) {
      clientConfig.region = config.awsS3Region;
    }

    if (config.awsS3AccessKeyId && config.awsS3SecretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.awsS3AccessKeyId,
        secretAccessKey: config.awsS3SecretAccessKey
      };
    }

    s3Client = new S3Client(clientConfig);
  }

  return s3Client;
};

const normalizeStorageUploadError = (error) => {
  const statusCode = error?.statusCode || error?.status;
  if (statusCode === 503 && error?.code === STORAGE_ERROR_CODES.NOT_CONFIGURED) {
    return error;
  }

  const awsCode = `${error?.name || error?.Code || ''}`.trim();

  if (awsCode === 'AccessDenied') {
    return createError(503, 'Storage access denied for upload bucket', {
      code: STORAGE_ERROR_CODES.ACCESS_DENIED
    });
  }

  if (awsCode === 'CredentialsProviderError' || awsCode === 'InvalidAccessKeyId' || awsCode === 'SignatureDoesNotMatch') {
    return createError(503, 'Storage credentials are invalid or unavailable', {
      code: STORAGE_ERROR_CODES.INVALID_CREDENTIALS
    });
  }

  if (awsCode === 'AuthorizationHeaderMalformed' || awsCode === 'PermanentRedirect') {
    return createError(503, 'Storage region mismatch for configured bucket', {
      code: STORAGE_ERROR_CODES.REGION_MISMATCH
    });
  }

  if (awsCode === 'NoSuchBucket') {
    return createError(503, 'Configured storage bucket was not found', {
      code: STORAGE_ERROR_CODES.BUCKET_NOT_FOUND
    });
  }

  return createError(502, 'Failed to upload file to storage', {
    code: STORAGE_ERROR_CODES.UPLOAD_FAILED
  });
};

const sendPutObject = async (s3, putCommand) => {
  try {
    await s3.send(putCommand);
  } catch (error) {
    throw normalizeStorageUploadError(error);
  }
};

const sanitizeFileName = (value = '') => value.replace(/[^a-z0-9.\-]/gi, '-').replace(/-+/g, '-').toLowerCase();

const buildObjectKey = ({ companyId, documentType, fileName }) => {
  const prefix = (config.awsS3UploadsFolder || 'uploads').replace(/\/$/, '');
  const normalizedFileName = sanitizeFileName(fileName) || `${documentType}-${Date.now()}`;
  const timeSegment = Date.now();
  return `${prefix}/company-verifications/${companyId}/${documentType}-${timeSegment}-${normalizedFileName}`;
};

const buildPublicUrl = (key) => {
  const bucket = config.awsS3Bucket;
  if (!bucket) {
    return key;
  }
  if (config.awsS3Region) {
    return `https://${bucket}.s3.${config.awsS3Region}.amazonaws.com/${key}`;
  }
  return `https://${bucket}.s3.amazonaws.com/${key}`;
};

const normalizeBase64Payload = (value = '') => {
  if (value.includes(',')) {
    const [, base64Payload] = value.split(',');
    return base64Payload;
  }
  return value;
};

//=====>>>>upload company verification documents====<<<<<
const uploadCompanyDocument = async ({ companyId, documentType, fileName, mimeType, base64 }) => {
  if (!base64 || typeof base64 !== 'string') {
    throw createError(400, `Invalid payload for ${documentType}`);
  }

  const s3 = getS3Client();
  const objectKey = buildObjectKey({ companyId, documentType, fileName });
  const cleanedBase64 = normalizeBase64Payload(base64);
  const buffer = Buffer.from(cleanedBase64, 'base64');

  if (!buffer.length) {
    throw createError(400, `${documentType} content cannot be empty`);
  }

  if (buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    throw createError(413, `${documentType} exceeds the 5 MB limit`);
  }

  const putCommand = new PutObjectCommand({
    Bucket: config.awsS3Bucket,
    Key: objectKey,
    Body: buffer,
    ContentType: mimeType || 'application/octet-stream'
  });

  await sendPutObject(s3, putCommand);

  return {
    key: objectKey,
    url: buildPublicUrl(objectKey),
    fileName,
    contentType: mimeType,
    size: buffer.length,
    uploadedAt: new Date()
  };
};

const buildUserObjectKey = ({ userId, purpose = 'general', fileName }) => {
  const prefix = (config.awsS3UploadsFolder || 'uploads').replace(/\/$/, '');
  const normalizedFileName = sanitizeFileName(fileName) || `${purpose}-${Date.now()}`;
  const timeSegment = Date.now();
  return `${prefix}/user-uploads/${userId}/${purpose}-${timeSegment}-${normalizedFileName}`;
};

const buildProductObjectKey = ({ companyId, productId, fileName }) => {
  const prefix = (config.awsS3UploadsFolder || 'uploads').replace(/\/$/, '');
  const normalizedFileName = sanitizeFileName(fileName) || `product-${Date.now()}`;
  const timeSegment = Date.now();
  return `${prefix}/products/${companyId}/${productId}/${timeSegment}-${normalizedFileName}`;
};


//=====>>>Upload user documents <<<===-
const uploadUserDocument = async ({ userId, purpose = 'general', fileName, mimeType, base64 }) => {
  if (!base64 || typeof base64 !== 'string') {
    throw createError(400, 'Invalid file payload supplied');
  }

  const s3 = getS3Client();
  const objectKey = buildUserObjectKey({ userId, purpose, fileName });
  const cleanedBase64 = normalizeBase64Payload(base64);
  const buffer = Buffer.from(cleanedBase64, 'base64');

  if (!buffer.length) {
    throw createError(400, 'File content cannot be empty');
  }

  if (buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    throw createError(413, 'File exceeds the 5 MB limit');
  }

  const putCommand = new PutObjectCommand({
    Bucket: config.awsS3Bucket,
    Key: objectKey,
    Body: buffer,
    ContentType: mimeType || 'application/octet-stream'
  });

  await sendPutObject(s3, putCommand);

  return {
    key: objectKey,
    url: buildPublicUrl(objectKey),
    fileName,
    contentType: mimeType,
    size: buffer.length,
    uploadedAt: new Date()
  };
};

const uploadProductImage = async ({ companyId, productId, userId, fileName, mimeType, base64 }) => {
  if (!base64 || typeof base64 !== 'string') {
    throw createError(400, 'Invalid image payload supplied');
  }

  const s3 = getS3Client();
  const objectKey = buildProductObjectKey({ companyId, productId, fileName });
  const cleanedBase64 = normalizeBase64Payload(base64);
  const buffer = Buffer.from(cleanedBase64, 'base64');

  if (!buffer.length) {
    throw createError(400, 'Image content cannot be empty');
  }

  if (buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    throw createError(413, 'Image exceeds the 5 MB limit');
  }

  const putCommand = new PutObjectCommand({
    Bucket: config.awsS3Bucket,
    Key: objectKey,
    Body: buffer,
    ContentType: mimeType || 'application/octet-stream'
  });

  await sendPutObject(s3, putCommand);

  return {
    key: objectKey,
    url: buildPublicUrl(objectKey),
    fileName,
    contentType: mimeType,
    size: buffer.length,
    uploadedAt: new Date(),
    uploadedBy: userId
  };
};

module.exports = {
  uploadCompanyDocument,
  uploadUserDocument,
  uploadProductImage
};
