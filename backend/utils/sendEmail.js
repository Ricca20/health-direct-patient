require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: `"Health Direct" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    });
    console.log('Email sent to:', to);
    return true;
  } catch (err) {
    console.error('Error sending email:', err.message);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;