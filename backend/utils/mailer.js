const nodemailer = require('nodemailer');

const getBooleanEnv = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
};

const getMailTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 465),
    secure: getBooleanEnv(process.env.EMAIL_SECURE, true),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const getMailFrom = (label = process.env.EMAIL_FROM_NAME || 'Sistema UGEL') => {
  const address = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  return `"${label}" <${address}>`;
};

const getSpecialistRecipients = () => (
  (process.env.EMAIL_SPECIALIST_TO || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
);

const isNotificationsEnabled = () => (
  getBooleanEnv(process.env.EMAIL_NOTIFICATIONS_ENABLED, true)
);

const sendMail = async (mailOptions) => {
  const transporter = getMailTransporter();

  if (!transporter) {
    console.warn('Correo no configurado: faltan EMAIL_HOST, EMAIL_USER o EMAIL_PASS.');
    return { skipped: true, reason: 'missing-mail-config' };
  }

  return transporter.sendMail({
    ...mailOptions,
    from: mailOptions.from || getMailFrom(),
  });
};

const sendSpecialistNotification = async ({ subject, html, text }) => {
  if (!isNotificationsEnabled()) {
    return { skipped: true, reason: 'notifications-disabled' };
  }

  const recipients = getSpecialistRecipients();
  if (recipients.length === 0) {
    console.warn('Correo de especialista no configurado: falta EMAIL_SPECIALIST_TO.');
    return { skipped: true, reason: 'missing-specialist-recipient' };
  }

  return sendMail({
    to: recipients,
    subject,
    html,
    text,
  });
};

const getFrontendUrl = () => process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const renderInfoRows = (rows = []) => rows
  .map(({ label, value }) => `
    <tr>
      <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; width: 150px;">${escapeHtml(label)}</td>
      <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${escapeHtml(value || 'No registrado')}</td>
    </tr>
  `)
  .join('');

const renderInstitutionalEmail = ({
  eyebrow = 'Sistema UGEL Santa',
  title,
  intro,
  rows = [],
  actionLabel = 'Abrir sistema',
  actionUrl = getFrontendUrl(),
  note,
}) => `
  <div style="margin: 0; padding: 28px 0; background: #f1f5f9; font-family: Arial, sans-serif; color: #0f172a;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe4f0; border-radius: 18px; overflow: hidden; box-shadow: 0 14px 32px rgba(15, 23, 42, .10);">
      <div style="background: #0f4f8f; padding: 24px 28px;">
        <p style="margin: 0 0 8px; color: #bfdbfe; font-size: 11px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;">${escapeHtml(eyebrow)}</p>
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; line-height: 1.25; font-weight: 800;">${escapeHtml(title)}</h1>
      </div>

      <div style="padding: 28px;">
        <p style="margin: 0 0 18px; color: #475569; font-size: 15px; line-height: 1.65;">${escapeHtml(intro)}</p>

        <table role="presentation" style="width: 100%; border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
          <tbody>
            <tr>
              <td style="padding: 18px 20px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tbody>${renderInfoRows(rows)}</tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 24px;">
          <a href="${escapeHtml(actionUrl)}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 800;">${escapeHtml(actionLabel)}</a>
        </div>

        ${note ? `<p style="margin: 22px 0 0; color: #64748b; font-size: 13px; line-height: 1.55;">${escapeHtml(note)}</p>` : ''}
      </div>

      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">Este es un mensaje automatico del Sistema de Gestion de Recursos Propios.</p>
      </div>
    </div>
  </div>
`;

module.exports = {
  getFrontendUrl,
  getMailFrom,
  renderInstitutionalEmail,
  sendMail,
  sendSpecialistNotification,
};
