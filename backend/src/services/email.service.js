const nodemailer = require('nodemailer');
const config = require('../config/env');

/**
 * Email Service
 * Handles sending emails via SMTP (nodemailer)
 */

// Create reusable transporter
let transporter = null;

/**
 * Initialize the email transporter
 * Uses SMTP configuration from environment variables
 */
const initTransporter = () => {
  if (transporter) return transporter;

  // Check if SMTP credentials are configured
  if (!config.smtpUser || !config.smtpPass) {
    console.warn('[EmailService] SMTP credentials not configured. Emails will be logged but not sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });

  return transporter;
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise<Object>} - Send result with success status
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const transport = initTransporter();

  // If no transporter (SMTP not configured), log and return mock success
  if (!transport) {
    console.log('[EmailService] Email would be sent (SMTP not configured):');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text?.substring(0, 200)}...`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      mock: true
    };
  }

  try {
    const mailOptions = {
      from: config.emailFrom,
      to,
      subject,
      text,
      html: html || text
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`[EmailService] Email sent successfully to ${to}. MessageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      mock: false
    };
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
    return {
      success: false,
      error: error.message,
      mock: false
    };
  }
};

/**
 * Send document request email to company owner
 * @param {Object} options - Email options
 * @param {string} options.ownerEmail - Owner's email address
 * @param {string} options.ownerName - Owner's display name
 * @param {string} options.companyName - Company display name
 * @param {string} options.customMessage - Optional custom message from admin
 * @returns {Promise<Object>} - Send result
 */
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
    <h1 style="color: white; margin: 0; font-size: 24px;">${config.appName}</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Action Required: Submit Verification Documents</h2>

    <p>Hello <strong>${ownerName}</strong>,</p>

    <p>Your company <strong>"${companyName}"</strong> is pending verification on ${config.appName}.</p>

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
      <p style="margin: 10px 0 0 0;">${customMessage}</p>
    </div>
    ` : ''}

    <p>Please log in to your account and navigate to <strong>Company Settings &gt; Verification</strong> to upload your documents.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${config.appUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Go to ${config.appName}
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; margin: 0;">
      Best regards,<br>
      ${config.appName} Team
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

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>} - True if connection is successful
 */
const verifyConnection = async () => {
  const transport = initTransporter();
  if (!transport) {
    return false;
  }

  try {
    await transport.verify();
    console.log('[EmailService] SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('[EmailService] SMTP connection verification failed:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendDocumentRequestEmail,
  verifyConnection
};
