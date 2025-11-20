const createError = require('http-errors');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config/env');

const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB guardrail for compliance files.

let s3Client;

const getS3Client = () => {
  if (!config.awsS3Bucket) {
    throw createError(500, 'AWS S3 bucket is not configured');
  }

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

  await s3.send(putCommand);

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

  await s3.send(putCommand);

  return {
    key: objectKey,
    url: buildPublicUrl(objectKey),
    fileName,
    contentType: mimeType,
    size: buffer.length,
    uploadedAt: new Date()
  };
};

module.exports = {
  uploadCompanyDocument,
  uploadUserDocument
};
