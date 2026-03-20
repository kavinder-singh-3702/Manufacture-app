process.env.NODE_ENV = 'test';

const captureError = async (promiseFactory) => {
  try {
    await promiseFactory();
    return null;
  } catch (error) {
    return error;
  }
};

describe('storage service config validation', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      AWS_S3_BUCKET: '',
      AWS_S3_REGION: ''
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('upload endpoints share STORAGE_NOT_CONFIGURED 503 when S3 env is missing', async () => {
    const { uploadCompanyDocument, uploadUserDocument, uploadProductImage } = require('../src/services/storage.service');

    const sharedPayload = {
      fileName: 'sample.png',
      mimeType: 'image/png',
      base64: 'aGVsbG8='
    };

    const errors = await Promise.all([
      captureError(() =>
        uploadCompanyDocument({
          companyId: 'company-1',
          documentType: 'gstCertificate',
          ...sharedPayload
        })
      ),
      captureError(() =>
        uploadUserDocument({
          userId: 'user-1',
          purpose: 'general',
          ...sharedPayload
        })
      ),
      captureError(() =>
        uploadProductImage({
          companyId: 'company-1',
          productId: 'product-1',
          userId: 'user-1',
          ...sharedPayload
        })
      )
    ]);

    errors.forEach((error) => {
      expect(error).toBeTruthy();
      expect(error.code).toBe('STORAGE_NOT_CONFIGURED');
      expect(error.statusCode || error.status).toBe(503);
      expect(error.message).toContain('AWS_S3_BUCKET');
      expect(error.message).toContain('AWS_S3_REGION');
    });
  });
});
