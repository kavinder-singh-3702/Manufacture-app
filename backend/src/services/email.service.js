const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

const toSafeString = (value) => (typeof value === 'string' ? value.trim() : '');

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildSuccessResult = ({ providerMessageId, mock = false } = {}) => ({
  success: true,
  providerMessageId: providerMessageId || null,
  errorCode: null,
  errorMessage: null,
  error: null,
  mock
});

const buildFailureResult = ({ errorCode, errorMessage, mock = false }) => ({
  success: false,
  providerMessageId: null,
  errorCode: errorCode || 'email_send_failed',
  errorMessage: errorMessage || 'Unknown email send error',
  error: errorMessage || 'Unknown email send error',
  mock
});

const initTransporter = () => {
  if (transporter) return transporter;

  if (!config.smtpUser || !config.smtpPass) {
    console.warn('[EmailService] SMTP credentials are not configured. Emails are logged in mock mode.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    pool: config.smtpPoolEnabled,
    maxConnections: Math.max(Number(config.smtpPoolMaxConnections) || 1, 1),
    maxMessages: Math.max(Number(config.smtpPoolMaxMessages) || 20, 1),
    connectionTimeout: Math.max(Number(config.smtpConnectionTimeoutMs) || 10000, 1000),
    socketTimeout: Math.max(Number(config.smtpSocketTimeoutMs) || 20000, 1000),
    greetingTimeout: Math.max(Number(config.smtpGreetingTimeoutMs) || 10000, 1000),
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const recipient = toSafeString(to);
  const normalizedSubject = toSafeString(subject);

  if (!recipient) {
    return buildFailureResult({
      errorCode: 'missing_recipient',
      errorMessage: 'Recipient email address is required.'
    });
  }

  const transport = initTransporter();

  if (!transport) {
    console.log('[EmailService] Mock email send (SMTP unavailable):', {
      to: recipient,
      subject: normalizedSubject
    });
    return buildSuccessResult({
      providerMessageId: `mock-${Date.now().toString(36)}`,
      mock: true
    });
  }

  try {
    const info = await transport.sendMail({
      from: config.emailFrom,
      to: recipient,
      subject: normalizedSubject,
      text: text || '',
      html: html || text || ''
    });

    return buildSuccessResult({
      providerMessageId: info?.messageId ? String(info.messageId) : null,
      mock: false
    });
  } catch (error) {
    const message = error?.message || 'SMTP transport failed';
    console.error(`[EmailService] Failed to send email to ${recipient}:`, message);
    return buildFailureResult({
      errorCode: 'smtp_send_failed',
      errorMessage: message,
      mock: false
    });
  }
};

const sendDocumentRequestEmail = async ({ ownerEmail, ownerName, companyName, customMessage }) => {
  const subject = `Action Required: Submit Verification Documents for ${companyName}`;

  const text = `
Hello ${ownerName},

Your company "${companyName}" is pending verification on ${config.appName}.

To complete the verification process, please submit the following documents:
- GST Certificate
- Aadhaar Card (of authorized signatory)

${customMessage ? `Message from Admin:\n${customMessage}\n` : ''}
Please log in to your account and navigate to Company Settings > Verification to upload your documents.

If you have any questions, please contact our support team.

Best regards,
${config.appName} Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${escapeHtml(config.appName)}</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Action Required: Submit Verification Documents</h2>

    <p>Hello <strong>${escapeHtml(ownerName)}</strong>,</p>

    <p>Your company <strong>"${escapeHtml(companyName)}"</strong> is pending verification on ${escapeHtml(config.appName)}.</p>

    <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Required Documents:</strong></p>
      <ul style="margin: 0; padding-left: 20px;">
        <li>GST Certificate</li>
        <li>Aadhaar Card (of authorized signatory)</li>
      </ul>
    </div>

    ${customMessage ? `
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Message from Admin:</strong></p>
      <p style="margin: 10px 0 0 0;">${escapeHtml(customMessage)}</p>
    </div>
    ` : ''}

    <p>Please log in to your account and navigate to <strong>Company Settings &gt; Verification</strong> to upload your documents.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${escapeHtml(config.appUrl)}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Go to ${escapeHtml(config.appName)}
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; margin: 0;">
      Best regards,<br>
      ${escapeHtml(config.appName)} Team
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: ownerEmail,
    subject,
    text,
    html
  });
};

const sendBusinessSetupSubmissionEmail = async ({
  to,
  contactName,
  referenceCode,
  businessType,
  workModel,
  location,
  startTimeline
}) => {
  const safeName = toSafeString(contactName) || 'there';
  const safeBusinessType = toSafeString(businessType) || 'your business';
  const safeWorkModel = toSafeString(workModel) || 'n/a';
  const safeLocation = toSafeString(location) || 'n/a';
  const safeTimeline = toSafeString(startTimeline) || 'n/a';

  const subject = `Startup request received (${referenceCode})`;
  const text = `
Hi ${safeName},

We have received your startup assistance request (${referenceCode}).

Summary:
- Business type: ${safeBusinessType}
- Work model: ${safeWorkModel}
- Location: ${safeLocation}
- Start timeline: ${safeTimeline}

Our operations team will contact you shortly with next steps.

Thanks,
${config.appName} Team
  `.trim();

  const html = `
<p>Hi ${escapeHtml(safeName)},</p>
<p>We have received your startup assistance request <strong>(${escapeHtml(referenceCode)})</strong>.</p>
<p><strong>Summary</strong></p>
<ul>
  <li>Business type: ${escapeHtml(safeBusinessType)}</li>
  <li>Work model: ${escapeHtml(safeWorkModel)}</li>
  <li>Location: ${escapeHtml(safeLocation)}</li>
  <li>Start timeline: ${escapeHtml(safeTimeline)}</li>
</ul>
<p>Our operations team will contact you shortly with next steps.</p>
<p>Thanks,<br>${escapeHtml(config.appName)} Team</p>
  `.trim();

  return sendEmail({ to, subject, text, html });
};

const sendBusinessSetupStatusEmail = async ({
  to,
  contactName,
  referenceCode,
  status,
  note
}) => {
  const safeName = toSafeString(contactName) || 'there';
  const safeStatus = toSafeString(status).replace(/_/g, ' ') || 'updated';
  const safeNote = toSafeString(note);
  const subject = `Startup request update (${referenceCode})`;

  const text = `
Hi ${safeName},

Your startup assistance request (${referenceCode}) is now: ${safeStatus}.
${safeNote ? `\nAdditional note from our team: ${safeNote}\n` : ''}
If you need help, reply to this email or contact support.

Thanks,
${config.appName} Team
  `.trim();

  const html = `
<p>Hi ${escapeHtml(safeName)},</p>
<p>Your startup assistance request <strong>(${escapeHtml(referenceCode)})</strong> is now: <strong>${escapeHtml(safeStatus)}</strong>.</p>
${safeNote ? `<p><strong>Additional note from our team:</strong> ${escapeHtml(safeNote)}</p>` : ''}
<p>If you need help, reply to this email or contact support.</p>
<p>Thanks,<br>${escapeHtml(config.appName)} Team</p>
  `.trim();

  return sendEmail({ to, subject, text, html });
};

const verifyConnection = async () => {
  const transport = initTransporter();
  if (!transport) {
    return buildFailureResult({
      errorCode: 'smtp_not_configured',
      errorMessage: 'SMTP credentials are not configured.',
      mock: true
    });
  }

  try {
    await transport.verify();
    return buildSuccessResult({ providerMessageId: 'smtp-connection-verified', mock: false });
  } catch (error) {
    return buildFailureResult({
      errorCode: 'smtp_verify_failed',
      errorMessage: error?.message || 'SMTP verification failed',
      mock: false
    });
  }
};

module.exports = {
  sendEmail,
  sendDocumentRequestEmail,
  sendBusinessSetupSubmissionEmail,
  sendBusinessSetupStatusEmail,
  verifyConnection
};
