const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Generate a TOTP secret for a user
 */
function generateSecret() {
  return speakeasy.generateSecret({
    name: 'Tailor ERP',
    issuer: 'Tailor ERP'
  });
}

/**
 * Generate QR code for TOTP setup
 */
async function generateQRCode(secret) {
  try {
    return await QRCode.toDataURL(secret.otpauth_url);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Verify TOTP token
 */
function verifyToken(token, secret) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps (30 seconds each) for clock drift
  });
}

module.exports = {
  generateSecret,
  generateQRCode,
  verifyToken
};
