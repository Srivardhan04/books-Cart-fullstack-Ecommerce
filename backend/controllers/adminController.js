const asyncHandler = require('express-async-handler');
const pool = require('../config/db');

// ──────────────────────────────────────────────────────────────
// GET /api/admin/stats — Dashboard summary cards
// ──────────────────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
    const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalRevenue }]] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM orders');
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM products');
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'");
    const [[{ pendingOrders }]] = await pool.query("SELECT COUNT(*) AS pendingOrders FROM orders WHERE status = 'pending'");
    const [[{ unreadNotifications }]] = await pool.query('SELECT COUNT(*) AS unreadNotifications FROM admin_notifications WHERE is_read = FALSE');

    res.json({
        totalOrders: Number(totalOrders),
        totalRevenue: Number(totalRevenue),
        totalProducts: Number(totalProducts),
        totalUsers: Number(totalUsers),
        pendingOrders: Number(pendingOrders),
        unreadNotifications: Number(unreadNotifications),
    });
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/notifications — All notifications (newest first)
// ──────────────────────────────────────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        'SELECT n.*, o.total_amount, o.status AS order_status FROM admin_notifications n LEFT JOIN orders o ON n.order_id = o.id ORDER BY n.created_at DESC LIMIT 50'
    );
    res.json(rows);
});

// ──────────────────────────────────────────────────────────────
// PUT /api/admin/notifications/:id/read — Mark one as read
// ──────────────────────────────────────────────────────────────
const markNotificationRead = asyncHandler(async (req, res) => {
    await pool.query('UPDATE admin_notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notification marked as read' });
});

// ──────────────────────────────────────────────────────────────
// PUT /api/admin/notifications/read-all — Mark all as read
// ──────────────────────────────────────────────────────────────
const markAllNotificationsRead = asyncHandler(async (req, res) => {
    await pool.query('UPDATE admin_notifications SET is_read = TRUE WHERE is_read = FALSE');
    res.json({ message: 'All notifications marked as read' });
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/orders — All orders with customer details & items
// ──────────────────────────────────────────────────────────────
const getAdminOrders = asyncHandler(async (req, res) => {
    const [orders] = await pool.query(
        `SELECT o.*, u.name AS customer_name, u.email AS customer_email 
         FROM orders o 
         JOIN users u ON o.user_id = u.id 
         ORDER BY o.created_at DESC`
    );
    res.json(orders);
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/orders/:id — Single order with items
// ──────────────────────────────────────────────────────────────
const getAdminOrderDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [orders] = await pool.query(
        `SELECT o.*, u.name AS customer_name, u.email AS customer_email 
         FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?`,
        [id]
    );

    if (orders.length === 0) {
        res.status(404);
        throw new Error('Order not found');
    }

    const [items] = await pool.query(
        `SELECT oi.*, p.name, p.image_url 
         FROM order_items oi 
         LEFT JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [id]
    );

    res.json({ ...orders[0], items });
});

// ──────────────────────────────────────────────────────────────
// GET /api/admin/customers — All registered customers
// ──────────────────────────────────────────────────────────────
const getCustomers = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT u.id, u.name, u.email, u.created_at, 
                COUNT(o.id) AS total_orders, 
                COALESCE(SUM(o.total_amount), 0) AS total_spent
         FROM users u 
         LEFT JOIN orders o ON u.id = o.user_id 
         WHERE u.role = 'user'
         GROUP BY u.id 
         ORDER BY u.created_at DESC`
    );
    res.json(rows);
});

module.exports = {
    getDashboardStats,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getAdminOrders,
    getAdminOrderDetail,
    getCustomers,
};
