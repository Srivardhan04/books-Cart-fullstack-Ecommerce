const app = require('./app');
const dotenv = require('dotenv');
const { verifyEmailConnection } = require('./config/emailConfig');

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    // Verify SMTP connection (non-blocking — logs status only)
    await verifyEmailConnection();
});
