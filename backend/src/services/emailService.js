const nodemailer = require('nodemailer');

// Create transporter using Gmail
// You need to set these environment variables:
// GMAIL_EMAIL - your Gmail address
// GMAIL_APP_PASSWORD - your Gmail app password (not your regular password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

function generateOTP() {
  // Generate 8-digit random number
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function sendOTP(email, otp) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: email,
      subject: 'Password Reset OTP - Tailor ERP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d6efd;">Password Reset Request</h2>
          <p>You have requested to reset your password for Tailor ERP.</p>
          <p>Your One-Time Password (OTP) is:</p>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you did not request this password reset, please ignore this email.</p>
          <p style="color: #6c757d; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send OTP email');
  }
}

module.exports = {
  generateOTP,
  sendOTP
};
