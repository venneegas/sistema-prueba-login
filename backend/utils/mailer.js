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

module.exports = {
  getFrontendUrl,
  getMailFrom,
  sendMail,
  sendSpecialistNotification,
};
