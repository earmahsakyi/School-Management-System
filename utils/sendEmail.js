// utils/sendEmail.js
const { Resend } = require('resend');
const config = require('../config/default.json')
const resend = new Resend(config.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: config.EMAIL_FROM,
      to,
      subject,
      html,
    });

    return data;
  } catch (error) {
    console.error(" Resend Email Error:", error);
    throw error;
  }
};

module.exports = sendEmail;
