const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

const toSafeString = (value) => (typeof value === 'string' ? value.trim() : '');
const isProduction = () => toSafeString(config.node).toLowerCase() === 'production';

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

const EMAIL_STYLES = Object.freeze({
  bodyBackground: '#f3f7fc',
  cardBackground: '#ffffff',
  cardBorder: '#d9e5f2',
  text: '#1f2a3d',
  mutedText: '#5d6f8b',
  divider: '#e2eaf4',
  primary: '#148db2',
  primaryDark: '#0d7696',
  primarySoft: '#e8f6fb',
  primarySoftBorder: '#b8dfee',
  warningSoft: '#fff8e8',
  warningSoftBorder: '#f2cf83'
});

const getAppName = () => toSafeString(config.appName) || 'ARVANN';

const buildHtmlList = (items) => {
  const safeItems = items
    .map((item) => toSafeString(item))
    .filter(Boolean)
    .map((item) => `<li style="margin-bottom: 8px;">${escapeHtml(item)}</li>`)
    .join('');

  if (!safeItems) return '';

  return `<ul style="margin: 10px 0 0; padding-left: 20px; color: ${EMAIL_STYLES.text};">${safeItems}</ul>`;
};

const buildPanel = ({
  title,
  contentHtml,
  tone = 'info'
}) => {
  const safeTitle = toSafeString(title);
  const safeContent = toSafeString(contentHtml);
  if (!safeContent) return '';

  const isWarning = tone === 'warning';
  const backgroundColor = isWarning ? EMAIL_STYLES.warningSoft : EMAIL_STYLES.primarySoft;
  const borderColor = isWarning ? EMAIL_STYLES.warningSoftBorder : EMAIL_STYLES.primarySoftBorder;

  return `
  <div style="margin: 18px 0; padding: 16px; border-radius: 12px; background: ${backgroundColor}; border: 1px solid ${borderColor};">
    ${safeTitle ? `<p style="margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_STYLES.mutedText};">${escapeHtml(safeTitle)}</p>` : ''}
    <div style="margin-top: ${safeTitle ? '10px' : '0'}; color: ${EMAIL_STYLES.text}; font-size: 14px; line-height: 1.6;">
      ${safeContent}
    </div>
  </div>
  `.trim();
};

const buildKeyValueList = (rows) => {
  const safeRows = rows
    .map((row) => ({
      label: toSafeString(row?.label),
      value: toSafeString(row?.value) || 'n/a'
    }))
    .filter((row) => row.label);

  if (!safeRows.length) return '';

  const rowHtml = safeRows
    .map(
      (row) => `
      <tr>
        <td style="padding: 7px 0; font-weight: 600; color: ${EMAIL_STYLES.mutedText}; width: 42%;">${escapeHtml(row.label)}</td>
        <td style="padding: 7px 0; color: ${EMAIL_STYLES.text};">${escapeHtml(row.value)}</td>
      </tr>
      `
    )
    .join('');

  return `
  <table role="presentation" width="100%" style="border-collapse: collapse; margin-top: 6px;">
    ${rowHtml}
  </table>
  `.trim();
};

const buildOtpCodePanel = (otp) => {
  const safeOtp = toSafeString(otp) || '------';

  return `
  <div style="margin: 24px 0; padding: 18px; border-radius: 14px; background: ${EMAIL_STYLES.primarySoft}; border: 1px solid ${EMAIL_STYLES.primarySoftBorder}; text-align: center;">
    <p style="margin: 0 0 8px; color: ${EMAIL_STYLES.mutedText}; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;">Verification code</p>
    <p style="margin: 0; color: ${EMAIL_STYLES.primaryDark}; font-size: 30px; font-weight: 800; letter-spacing: 0.3em;">${escapeHtml(safeOtp)}</p>
  </div>
  `.trim();
};

const buildEmailLayout = ({
  preheader,
  title,
  subtitle,
  bodyHtml,
  ctaLabel,
  ctaHref,
  footerHint = 'Need help? Contact our support team.'
}) => {
  const appName = getAppName();
  const safeTitle = toSafeString(title);
  const safeSubtitle = toSafeString(subtitle);
  const safeBody = toSafeString(bodyHtml);
  const safePreheader = toSafeString(preheader) || safeTitle || appName;
  const safeCtaLabel = toSafeString(ctaLabel);
  const safeCtaHref = toSafeString(ctaHref || config.appUrl);
  const safeFooterHint = toSafeString(footerHint);
  const showCta = Boolean(safeCtaLabel && safeCtaHref);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(safeTitle || appName)}</title>
</head>
<body style="margin: 0; padding: 24px; background: ${EMAIL_STYLES.bodyBackground}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: ${EMAIL_STYLES.text};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; visibility: hidden; mso-hide: all;">
    ${escapeHtml(safePreheader)}
  </div>

  <div style="max-width: 600px; margin: 0 auto; background: ${EMAIL_STYLES.cardBackground}; border: 1px solid ${EMAIL_STYLES.cardBorder}; border-radius: 16px; overflow: hidden;">
    <div style="padding: 24px; background: linear-gradient(135deg, ${EMAIL_STYLES.primary} 0%, ${EMAIL_STYLES.primaryDark} 100%);">
      <p style="margin: 0; color: rgba(255, 255, 255, 0.85); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;">${escapeHtml(appName)}</p>
      <h1 style="margin: 8px 0 0; color: #ffffff; font-size: 24px; line-height: 1.3;">${escapeHtml(safeTitle)}</h1>
      ${safeSubtitle ? `<p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.92); font-size: 14px; line-height: 1.6;">${escapeHtml(safeSubtitle)}</p>` : ''}
    </div>

    <div style="padding: 24px;">
      ${safeBody}

      ${showCta ? `
      <div style="text-align: center; margin: 24px 0 20px;">
        <a href="${escapeHtml(safeCtaHref)}" style="display: inline-block; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; color: #ffffff; background: linear-gradient(135deg, ${EMAIL_STYLES.primary} 0%, ${EMAIL_STYLES.primaryDark} 100%);">
          ${escapeHtml(safeCtaLabel)}
        </a>
      </div>
      ` : ''}

      <hr style="border: none; border-top: 1px solid ${EMAIL_STYLES.divider}; margin: 18px 0;">
      <p style="margin: 0; color: ${EMAIL_STYLES.mutedText}; font-size: 12px; line-height: 1.6;">
        ${escapeHtml(safeFooterHint)}
      </p>
      <p style="margin: 10px 0 0; color: ${EMAIL_STYLES.mutedText}; font-size: 12px; line-height: 1.6;">
        Regards,<br>${escapeHtml(appName)} Team
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

const initTransporter = () => {
  if (transporter) return transporter;

  if (!config.smtpUser || !config.smtpPass) {
    if (isProduction()) {
      console.error('[EmailService] SMTP credentials are not configured in production.');
    } else {
      console.warn('[EmailService] SMTP credentials are not configured. Emails are logged in mock mode.');
    }
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
    if (isProduction()) {
      return buildFailureResult({
        errorCode: 'smtp_not_configured',
        errorMessage: 'SMTP credentials are not configured.',
        mock: false
      });
    }

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
  const appName = getAppName();
  const safeOwnerName = toSafeString(ownerName) || 'there';
  const safeCompanyName = toSafeString(companyName) || 'your company';
  const safeCustomMessage = toSafeString(customMessage);
  const subject = `Action Required: Submit Verification Documents for ${safeCompanyName}`;

  const text = `
Hello ${safeOwnerName},

Your company "${safeCompanyName}" is pending verification on ${appName}.

To complete the verification process, please submit the following documents:
- GST Certificate
- Aadhaar Card (of authorized signatory)

${safeCustomMessage ? `Message from Admin:\n${safeCustomMessage}\n` : ''}Please log in to your account and navigate to Company Settings > Verification to upload your documents.

Need help? Contact our support team.

Regards,
${appName} Team
  `.trim();

  const customMessagePanel = safeCustomMessage
    ? buildPanel({
      title: 'Message from Admin',
      contentHtml: `<p style="margin: 0;">${escapeHtml(safeCustomMessage)}</p>`,
      tone: 'warning'
    })
    : '';

  const html = buildEmailLayout({
    preheader: `Document submission required for ${safeCompanyName}`,
    title: 'Submit verification documents',
    subtitle: `${safeCompanyName} is pending verification`,
    bodyHtml: `
      <p style="margin: 0;">Hello <strong>${escapeHtml(safeOwnerName)}</strong>,</p>
      <p style="margin: 14px 0 0;">Your company <strong>"${escapeHtml(safeCompanyName)}"</strong> is pending verification on ${escapeHtml(appName)}.</p>
      ${buildPanel({
        title: 'Required documents',
        contentHtml: buildHtmlList(['GST Certificate', 'Aadhaar Card (of authorized signatory)'])
      })}
      ${customMessagePanel}
      <p style="margin: 14px 0 0;">Please log in and go to <strong>Company Settings &gt; Verification</strong> to upload your documents.</p>
    `,
    ctaLabel: `Open ${appName}`,
    ctaHref: config.appUrl
  });

  return sendEmail({
    to: ownerEmail,
    subject,
    text,
    html
  });
};

const sendSignupOtpEmail = async ({ to, fullName, otp, expiresInMs }) => {
  const appName = getAppName();
  const safeName = toSafeString(fullName) || 'there';
  const safeOtp = toSafeString(otp);
  const expiresInMinutes = Math.max(1, Math.ceil(Number(expiresInMs || 0) / 60000));
  const subject = `${appName} email verification code`;

  const text = `
Hi ${safeName},

Use this verification code to continue creating your ${appName} account:

${safeOtp}

This code expires in ${expiresInMinutes} minute${expiresInMinutes === 1 ? '' : 's'}.

If you did not request this code, you can ignore this email.

Regards,
${appName} Team
  `.trim();

  const html = buildEmailLayout({
    preheader: 'Your verification code is ready',
    title: 'Verify your email',
    subtitle: 'Complete signup securely in ARVANN',
    bodyHtml: `
      <p style="margin: 0;">Hi <strong>${escapeHtml(safeName)}</strong>,</p>
      <p style="margin: 14px 0 0;">Use this verification code to continue creating your ${escapeHtml(appName)} account.</p>
      ${buildOtpCodePanel(safeOtp)}
      <p style="margin: 0;">This code expires in <strong>${expiresInMinutes} minute${expiresInMinutes === 1 ? '' : 's'}</strong>.</p>
      <p style="margin: 10px 0 0; color: ${EMAIL_STYLES.mutedText};">If you did not request this code, you can ignore this email.</p>
    `,
    ctaLabel: `Open ${appName}`,
    ctaHref: config.appUrl
  });

  return sendEmail({
    to,
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
  const appName = getAppName();
  const safeName = toSafeString(contactName) || 'there';
  const safeReferenceCode = toSafeString(referenceCode) || 'n/a';
  const safeBusinessType = toSafeString(businessType) || 'your business';
  const safeWorkModel = toSafeString(workModel) || 'n/a';
  const safeLocation = toSafeString(location) || 'n/a';
  const safeTimeline = toSafeString(startTimeline) || 'n/a';

  const subject = `Startup request received (${safeReferenceCode})`;
  const text = `
Hi ${safeName},

We have received your startup assistance request (${safeReferenceCode}).

Summary:
- Business type: ${safeBusinessType}
- Work model: ${safeWorkModel}
- Location: ${safeLocation}
- Start timeline: ${safeTimeline}

Our operations team will contact you shortly with next steps.

Regards,
${appName} Team
  `.trim();

  const html = buildEmailLayout({
    preheader: `Startup request ${safeReferenceCode} received`,
    title: 'Startup request received',
    subtitle: `Reference ${safeReferenceCode}`,
    bodyHtml: `
      <p style="margin: 0;">Hi <strong>${escapeHtml(safeName)}</strong>,</p>
      <p style="margin: 14px 0 0;">We have received your startup assistance request <strong>(${escapeHtml(safeReferenceCode)})</strong>.</p>
      ${buildPanel({
        title: 'Request summary',
        contentHtml: buildKeyValueList([
          { label: 'Business type', value: safeBusinessType },
          { label: 'Work model', value: safeWorkModel },
          { label: 'Location', value: safeLocation },
          { label: 'Start timeline', value: safeTimeline }
        ])
      })}
      <p style="margin: 14px 0 0;">Our operations team will contact you shortly with next steps.</p>
    `,
    ctaLabel: `Open ${appName}`,
    ctaHref: config.appUrl
  });

  return sendEmail({ to, subject, text, html });
};

const sendBusinessSetupStatusEmail = async ({
  to,
  contactName,
  referenceCode,
  status,
  note
}) => {
  const appName = getAppName();
  const safeName = toSafeString(contactName) || 'there';
  const safeReferenceCode = toSafeString(referenceCode) || 'n/a';
  const safeStatus = toSafeString(status).replace(/_/g, ' ') || 'updated';
  const safeNote = toSafeString(note);
  const subject = `Startup request update (${safeReferenceCode})`;

  const text = `
Hi ${safeName},

Your startup assistance request (${safeReferenceCode}) is now: ${safeStatus}.
${safeNote ? `\nAdditional note from our team: ${safeNote}\n` : ''}
If you need help, reply to this email or contact support.

Regards,
${appName} Team
  `.trim();

  const notePanel = safeNote
    ? buildPanel({
      title: 'Additional note',
      contentHtml: `<p style="margin: 0;">${escapeHtml(safeNote)}</p>`,
      tone: 'warning'
    })
    : '';

  const html = buildEmailLayout({
    preheader: `Startup request ${safeReferenceCode} status updated`,
    title: 'Startup request update',
    subtitle: `Reference ${safeReferenceCode}`,
    bodyHtml: `
      <p style="margin: 0;">Hi <strong>${escapeHtml(safeName)}</strong>,</p>
      ${buildPanel({
        title: 'Current status',
        contentHtml: `<p style="margin: 0; font-size: 16px; font-weight: 700; color: ${EMAIL_STYLES.primaryDark}; text-transform: capitalize;">${escapeHtml(safeStatus)}</p>`
      })}
      ${notePanel}
      <p style="margin: 14px 0 0;">If you need help, reply to this email or contact support.</p>
    `,
    ctaLabel: `Open ${appName}`,
    ctaHref: config.appUrl
  });

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
  sendSignupOtpEmail,
  sendBusinessSetupSubmissionEmail,
  sendBusinessSetupStatusEmail,
  verifyConnection
};
