process.env.NODE_ENV = 'test';

describe('server startup storage validation', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('fails startup before connecting infra when required S3 env vars are missing', async () => {
    process.env.AWS_S3_BUCKET = '';
    process.env.AWS_S3_REGION = '';

    const mockConnectRedis = jest.fn();
    const mockConnectDatabase = jest.fn();
    const mockInitSocket = jest.fn();
    const mockStartNotificationDispatcher = jest.fn();
    const mockLoggerError = jest.fn();

    jest.doMock('../src/app', () => ({}));
    jest.doMock('../src/config/redis', () => ({
      connectRedis: mockConnectRedis,
      disconnectRedis: jest.fn()
    }));
    jest.doMock('../src/config/database', () => ({
      connectDatabase: mockConnectDatabase,
      disconnectDatabase: jest.fn()
    }));
    jest.doMock('../src/socket', () => ({
      initSocket: mockInitSocket
    }));
    jest.doMock('../src/modules/notifications/services/notificationDispatcher.service', () => ({
      startNotificationDispatcher: mockStartNotificationDispatcher,
      stopNotificationDispatcher: jest.fn()
    }));
    jest.doMock('../src/utils/logger', () => () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: mockLoggerError
    }));

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
    const { start } = require('../src/server');

    await start();

    expect(mockConnectRedis).not.toHaveBeenCalled();
    expect(mockConnectDatabase).not.toHaveBeenCalled();
    expect(mockInitSocket).not.toHaveBeenCalled();
    expect(mockStartNotificationDispatcher).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to start server',
      expect.stringContaining('[STORAGE_NOT_CONFIGURED]')
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
