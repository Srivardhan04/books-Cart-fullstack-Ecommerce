// ============================================================
// Email Service - Centralized Email Sending Logic
// ============================================================
// Clean, professional email templates. No images.
// All email failures are caught and logged — they NEVER break
// the order flow. The user always gets a successful response.
// ============================================================

const { transporter } = require('../config/emailConfig');
const pool = require('../config/db');

// ──────────────────────────────────────────────────────────────
// Helper: Format currency
// ──────────────────────────────────────────────────────────────
const formatCurrency = (amount) => `₹${Number(amount).toFixed(2)}`;

// ──────────────────────────────────────────────────────────────
// Helper: Format date
// ──────────────────────────────────────────────────────────────
const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// ──────────────────────────────────────────────────────────────
// Helper: Build order items HTML table rows
// ──────────────────────────────────────────────────────────────
const buildItemRows = (items) => {
    return items
        .map(
            (item, index) => `
        <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#555;text-align:center;">${index + 1}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#222;">${item.name || 'Product'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#222;text-align:center;">${item.quantity}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#222;text-align:right;">${formatCurrency(item.price)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#222;text-align:right;font-weight:600;">${formatCurrency(Number(item.price) * item.quantity)}</td>
        </tr>`
        )
        .join('');
};

// ──────────────────────────────────────────────────────────────
// Shared: Consistent email wrapper
// ──────────────────────────────────────────────────────────────
const emailWrapper = (headerBg, headerText, subtitle, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                    <td style="background:${headerBg};padding:28px 32px;">
                        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Books Cart</h1>
                        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${subtitle}</p>
                    </td>
                </tr>

                <!-- Title Bar -->
                <tr>
                    <td style="padding:24px 32px 0;">
                        <h2 style="margin:0;color:#1a1a1a;font-size:18px;font-weight:600;">${headerText}</h2>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding:16px 32px 32px;">
                        ${bodyContent}
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background:#fafafa;padding:20px 32px;border-top:1px solid #eee;">
                        <p style="margin:0;color:#999;font-size:11px;text-align:center;">
                            &copy; ${new Date().getFullYear()} Books Cart &middot; This is an automated message. Please do not reply directly.
                        </p>
                    </td>
                </tr>

            </table>
        </td></tr>
    </table>
</body>
</html>`;

// ──────────────────────────────────────────────────────────────
// Shared: Order items table
// ──────────────────────────────────────────────────────────────
const orderTable = (items, totalAmount) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:4px;border-collapse:collapse;margin-top:16px;">
        <thead>
            <tr style="background:#f9f9f9;">
                <th style="padding:10px 12px;text-align:center;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;width:36px;">#</th>
                <th style="padding:10px 12px;text-align:left;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;">Item</th>
                <th style="padding:10px 12px;text-align:center;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;width:50px;">Qty</th>
                <th style="padding:10px 12px;text-align:right;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;width:80px;">Price</th>
                <th style="padding:10px 12px;text-align:right;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;width:90px;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            ${buildItemRows(items)}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4" style="padding:12px;text-align:right;font-weight:700;color:#1a1a1a;font-size:14px;border-top:2px solid #eee;">Total</td>
                <td style="padding:12px;text-align:right;font-weight:700;color:#1a1a1a;font-size:16px;border-top:2px solid #eee;">${formatCurrency(totalAmount)}</td>
            </tr>
        </tfoot>
    </table>`;

// ══════════════════════════════════════════════════════════════
// 1. SEND ORDER CONFIRMATION TO CUSTOMER
// ══════════════════════════════════════════════════════════════
const sendOrderConfirmationToUser = async ({ orderId, customerName, customerEmail, orderItems, totalAmount, orderDate }) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn(`⚠️  Skipping customer email (SMTP not configured) for Order #${orderId}`);
            return false;
        }

        const bodyContent = `
            <p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 16px;">
                Hi <strong>${customerName}</strong>, thank you for your purchase. Your order has been received and is now being processed.
            </p>

            <!-- Order Meta -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;width:100px;">Order ID</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:14px;font-weight:600;">#${orderId}</td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Date</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:14px;">${formatDate(orderDate)}</td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                    <td style="padding:8px 0;">
                        <span style="display:inline-block;background:#fff3cd;color:#856404;padding:3px 10px;border-radius:3px;font-size:12px;font-weight:600;">Pending</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Payment</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:14px;">Cash on Delivery</td>
                </tr>
            </table>

            <!-- Items -->
            <h3 style="margin:20px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;">Order Items</h3>
            ${orderTable(orderItems, totalAmount)}

            <p style="color:#888;font-size:12px;line-height:1.5;margin:20px 0 0;">
                You will receive updates when your order status changes. If you have questions, contact our support team.
            </p>
        `;

        const html = emailWrapper(
            '#1a1a1a',
            `Order Confirmed — #${orderId}`,
            'Order Confirmation',
            bodyContent
        );

        const mailOptions = {
            from: `"Books Cart" <${process.env.SMTP_USER}>`,
            to: customerEmail,
            subject: `Order Confirmed — #${orderId}`,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Customer confirmation sent for Order #${orderId} → ${customerEmail} (${info.messageId})`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send customer email for Order #${orderId}:`, error.message);
        return false;
    }
};

// ══════════════════════════════════════════════════════════════
// 2. SEND NEW ORDER ALERT TO ADMIN(S) — "Payment Received"
// ══════════════════════════════════════════════════════════════
const sendOrderNotificationToAdmin = async ({ orderId, customerName, customerEmail, orderItems, totalAmount, orderDate }) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn(`⚠️  Skipping admin email (SMTP not configured) for Order #${orderId}`);
            return false;
        }

        // Fetch all admin emails dynamically from the users table
        const [admins] = await pool.query("SELECT email, name FROM users WHERE role = 'admin'");

        if (admins.length === 0) {
            console.warn(`⚠️  No admin users found in database. Skipping admin notification for Order #${orderId}.`);
            return false;
        }

        const adminEmails = admins.map((a) => a.email);

        const bodyContent = `
            <p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 16px;">
                A new order has been placed on your store. Below are the details.
            </p>

            <!-- Customer & Order Meta -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;width:110px;">Order ID</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:14px;font-weight:600;">#${orderId}</td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Customer</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:14px;">${customerName}</td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Email</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:14px;"><a href="mailto:${customerEmail}" style="color:#2563eb;text-decoration:none;">${customerEmail}</a></td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Date</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:14px;">${formatDate(orderDate)}</td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Payment</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:14px;">Cash on Delivery</td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Amount</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:18px;font-weight:700;">${formatCurrency(totalAmount)}</td>
                </tr>
            </table>

            <!-- Items -->
            <h3 style="margin:20px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;">Items Ordered</h3>
            ${orderTable(orderItems, totalAmount)}

            <!-- Action -->
            <div style="margin-top:20px;padding:14px 16px;background:#f0f7ff;border-left:3px solid #2563eb;border-radius:0 4px 4px 0;">
                <p style="margin:0;color:#1a1a1a;font-size:13px;">
                    <strong>Action Required:</strong> Review and process this order from the Admin Dashboard.
                </p>
            </div>
        `;

        const html = emailWrapper(
            '#b91c1c',
            `New Order — #${orderId} (${formatCurrency(totalAmount)})`,
            'Seller Notification',
            bodyContent
        );

        const mailOptions = {
            from: `"Books Cart System" <${process.env.SMTP_USER}>`,
            to: adminEmails.join(', '),
            subject: `New Order #${orderId} — ${formatCurrency(totalAmount)} from ${customerName}`,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Admin notification sent for Order #${orderId} → [${adminEmails.join(', ')}] (${info.messageId})`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send admin email for Order #${orderId}:`, error.message);
        return false;
    }
};

// ══════════════════════════════════════════════════════════════
// 3. MAIN DISPATCHER — Send both emails in parallel
// ══════════════════════════════════════════════════════════════
const sendOrderEmails = async (orderData) => {
    console.log(`📨 Initiating email notifications for Order #${orderData.orderId}...`);

    // Fire both emails concurrently — neither blocks the other
    const [customerResult, adminResult] = await Promise.allSettled([
        sendOrderConfirmationToUser(orderData),
        sendOrderNotificationToAdmin(orderData),
    ]);

    const results = {
        customerEmailSent: customerResult.status === 'fulfilled' && customerResult.value === true,
        adminEmailSent: adminResult.status === 'fulfilled' && adminResult.value === true,
    };

    console.log(`📨 Email results for Order #${orderData.orderId}:`, JSON.stringify(results));
    return results;
};

module.exports = {
    sendOrderConfirmationToUser,
    sendOrderNotificationToAdmin,
    sendOrderEmails,
};
