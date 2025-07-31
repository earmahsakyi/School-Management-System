// utils/sendEmail.js
console.log("RESEND KEY:", process.env.RESEND_API_KEY); // Debug line
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM,
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
