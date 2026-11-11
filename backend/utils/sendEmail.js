const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
    // Prevent hanging on slow/unreachable SMTP servers
    connectionTimeout: 5000,  // 5 seconds
    greetingTimeout: 5000,   // 5 seconds
    socketTimeout: 5000,     // 5 seconds
  });
};

const emailTemplates = {
  emailVerification: (data) => ({
    subject: 'Verify Your Email - Attendance Analyzer',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #0d6efd); padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Attendance Analyzer</h1>
        </div>
        <h2 style="color: #1e3a5f; margin-bottom: 16px;">Hello, ${data.name}!</h2>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
          Thank you for registering. Please click the button below to verify your email address.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${data.verificationUrl}" 
             style="background: #0d6efd; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 13px; text-align: center;">
          This link expires in 24 hours. If you didn't register, please ignore this email.
        </p>
      </div>
    `,
  }),

  resetPassword: (data) => ({
    subject: 'Password Reset - Attendance Analyzer',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #0d6efd); padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Attendance Analyzer</h1>
        </div>
        <h2 style="color: #1e3a5f;">Password Reset Request</h2>
        <p style="color: #4b5563; line-height: 1.6;">Hi ${data.name},</p>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset your password. Click below to set a new one.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${data.resetUrl}" 
             style="background: #dc3545; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 13px; text-align: center;">
          This link expires in 10 minutes. If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    `,
  }),
};

const sendEmail = async ({ email, subject, template, data, html, text }) => {
  const transporter = createTransporter();

  let mailOptions = {
    from: `"${process.env.FROM_NAME || 'Attendance Analyzer'}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject,
  };

  if (template && emailTemplates[template]) {
    const templateContent = emailTemplates[template](data);
    mailOptions.subject = templateContent.subject || subject;
    mailOptions.html = templateContent.html;
  } else {
    mailOptions.html = html;
    mailOptions.text = text;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email send failed to ${email}: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
