const { verifyStorageConnection } = require('../services/storage.service');

const run = async () => {
  const result = await verifyStorageConnection();

  if (result.success) {
    console.log(`[storage:verify] Storage connection verified successfully. key=${result.key}`);
    if (result.cleanupWarning) {
      console.warn(`[storage:verify] Warning: ${result.cleanupWarning}`);
    }
    process.exit(0);
    return;
  }

  console.error('[storage:verify] Storage verification failed:', result.errorMessage || result.errorCode);
  process.exit(1);
};

run().catch((error) => {
  console.error('[storage:verify] Unexpected failure:', error?.message || error);
  process.exit(1);
});
