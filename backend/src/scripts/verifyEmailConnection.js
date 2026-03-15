const { verifyConnection } = require('../services/email.service');

const run = async () => {
  const result = await verifyConnection();
  if (result.success) {
    console.log('[email:verify] SMTP connection verified successfully.');
    process.exit(0);
    return;
  }

  console.error('[email:verify] SMTP verification failed:', result.errorMessage || result.errorCode);
  process.exit(1);
};

run().catch((error) => {
  console.error('[email:verify] Unexpected failure:', error?.message || error);
  process.exit(1);
});
