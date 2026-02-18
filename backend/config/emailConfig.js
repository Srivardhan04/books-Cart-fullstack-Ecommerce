// ============================================================
// Email Configuration - Nodemailer Transporter
// ============================================================
// Uses SMTP credentials from environment variables.
// Supports Gmail, Outlook, or any custom SMTP provider.
//
// Gmail users: Enable "App Passwords" in Google Account
//   → https://myaccount.google.com/apppasswords
//   → Use the 16-char app password as SMTP_PASS
// ============================================================

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Connection timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
});

/**
 * Verify SMTP connection on startup (non-blocking).
 * Logs success or failure — does NOT crash the server.
 */
const verifyEmailConnection = async () => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️  SMTP credentials not configured. Email notifications are DISABLED.');
        console.warn('   Set SMTP_USER and SMTP_PASS in .env to enable emails.');
        return false;
    }

    try {
        await transporter.verify();
        console.log('✅ Email service connected and ready');
        return true;
    } catch (error) {
        console.error('❌ Email service connection failed:', error.message);
        console.warn('   Orders will still work, but email notifications will not be sent.');
        return false;
    }
};

module.exports = { transporter, verifyEmailConnection };
