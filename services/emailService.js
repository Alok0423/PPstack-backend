const nodemailer = require('nodemailer');

let transporter;
const initTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not provided. Emails will not be sent.');
    return null;
  }
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
};

const sendWelcomeEmail = async (to, name) => {
  const t = initTransporter();
  if (!t) return Promise.resolve();

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'Welcome to PPStack!',
    html: `<h1>Welcome, ${name}!</h1><p>Thanks for signing in to PPStack — glad to have you.</p>`,
  };

  return t.sendMail(mailOptions);
};

module.exports = { sendWelcomeEmail };
