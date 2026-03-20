const loadStorageService = ({ configOverrides = {}, sendImpl } = {}) => {
  jest.resetModules();

  const send = jest.fn(sendImpl || (async () => ({ ok: true })));
  const S3Client = jest.fn(() => ({ send }));
  const PutObjectCommand = jest.fn((input) => ({ command: 'put', input }));
  const DeleteObjectCommand = jest.fn((input) => ({ command: 'delete', input }));

  jest.doMock('@aws-sdk/client-s3', () => ({
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand
  }));

  jest.doMock('../src/config/env', () => ({
    awsS3Bucket: 'arvann-bucket',
    awsS3Region: 'ap-south-1',
    awsS3AccessKeyId: 'test-access-key',
    awsS3SecretAccessKey: 'test-secret-key',
    awsS3UploadsFolder: 'uploads',
    ...configOverrides
  }));

  jest.doMock('../src/config/startupValidation', () => ({
    STORAGE_NOT_CONFIGURED_CODE: 'STORAGE_NOT_CONFIGURED',
    assertStorageConfig: jest.fn((config) => {
      if (!config.awsS3Bucket || !config.awsS3Region) {
        const error = new Error('Storage is not configured. Missing required environment variables: AWS_S3_BUCKET, AWS_S3_REGION');
        error.code = 'STORAGE_NOT_CONFIGURED';
        error.statusCode = 503;
        throw error;
      }
    })
  }));

  // eslint-disable-next-line global-require
  const storageService = require('../src/services/storage.service');

  return {
    storageService,
    send,
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand
  };
};

describe('storage service verification', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock('@aws-sdk/client-s3');
    jest.dontMock('../src/config/env');
    jest.dontMock('../src/config/startupValidation');
  });

  test('verifyStorageConnection uploads and cleans up the smoke object', async () => {
    const { storageService, send, PutObjectCommand, DeleteObjectCommand } = loadStorageService();

    const result = await storageService.verifyStorageConnection();

    expect(result.success).toBe(true);
    expect(result.cleanupWarning).toBeNull();
    expect(result.key).toMatch(/^uploads\/smoke-tests\/storage-verify-\d+\.txt$/);
    expect(PutObjectCommand).toHaveBeenCalledTimes(1);
    expect(DeleteObjectCommand).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(2);
  });

  test('verifyStorageConnection succeeds with warning when delete is denied', async () => {
    const { storageService } = loadStorageService({
      sendImpl: async (command) => {
        if (command.command === 'delete') {
          const error = new Error('Access denied');
          error.name = 'AccessDenied';
          throw error;
        }
        return { ok: true };
      }
    });

    const result = await storageService.verifyStorageConnection();

    expect(result.success).toBe(true);
    expect(result.cleanupWarning).toContain('cleanup was denied');
  });

  test('verifyStorageConnection fails when upload credentials are invalid', async () => {
    const { storageService } = loadStorageService({
      sendImpl: async () => {
        const error = new Error('Invalid access key');
        error.name = 'InvalidAccessKeyId';
        throw error;
      }
    });

    const result = await storageService.verifyStorageConnection();

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('STORAGE_INVALID_CREDENTIALS');
  });
});
