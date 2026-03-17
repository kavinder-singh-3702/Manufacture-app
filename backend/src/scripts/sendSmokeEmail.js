const { sendEmail } = require('../services/email.service');
const config = require('../config/env');

const recipient = process.argv[2] || process.env.EMAIL_SMOKE_TO;

const run = async () => {
  if (!recipient || !String(recipient).trim()) {
    console.error('[email:smoke] Missing recipient. Usage: npm run email:smoke -- you@example.com');
    process.exit(1);
    return;
  }

  const timestamp = new Date().toISOString();
  const appName = config.appName || 'ARVANN';

  const result = await sendEmail({
    to: recipient,
    subject: `[${appName}] SMTP smoke test (${timestamp})`,
    text: `SMTP smoke test from ${appName} at ${timestamp}.`,
    html: `<p>SMTP smoke test from <strong>${appName}</strong> at ${timestamp}.</p>`
  });

  if (!result.success || result.mock) {
    const reason = result.errorMessage || (result.mock ? 'SMTP is running in mock mode.' : 'Unknown email failure');
    console.error(`[email:smoke] Failed: ${reason}`);
    process.exit(1);
    return;
  }

  console.log(`[email:smoke] Sent successfully to ${recipient}. messageId=${result.providerMessageId || 'n/a'}`);
  process.exit(0);
};

run().catch((error) => {
  console.error('[email:smoke] Unexpected failure:', error?.message || error);
  process.exit(1);
});
