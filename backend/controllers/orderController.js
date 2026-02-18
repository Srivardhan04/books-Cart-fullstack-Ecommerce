const asyncHandler = require('express-async-handler');
const pool = require('../config/db');
const { sendOrderEmails } = require('../services/emailService');

const formatCurrency = (amount) => `₹${Number(amount).toFixed(2)}`;

const addOrderItems = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { orderItems, totalAmount, shippingAddress, city, state, zip_code, country } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    const connection = await pool.getConnection();
    let orderId;

    try {
        await connection.beginTransaction();

        // 1. Check stock and update
        for (const item of orderItems) {
            const [products] = await connection.query('SELECT stock, name FROM products WHERE id = ?', [item.product_id]);
            const product = products[0];

            if (!product) {
                throw new Error(`Product with ID ${item.product_id} not found`);
            }

            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }

            await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
        }

        // 2. Create order
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_amount, status, shipping_address, city, state, zip_code, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, totalAmount, 'pending', shippingAddress, city, state, zip_code, country]
        );
        orderId = orderResult.insertId;

        // 3. Add items
        for (const item of orderItems) {
            await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [orderId, item.product_id, item.quantity, item.price]);
        }

        // 4. Clear Cart
        await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        res.status(400);
        throw error;
    } finally {
        connection.release();
    }

    // ── 4. Send email notifications (non-blocking, never fails the order) ──
    try {
        // Fetch product names for the email (items from request may not have names)
        const productIds = orderItems.map((i) => i.product_id);
        const [products] = await pool.query(
            `SELECT id, name FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
            productIds
        );
        const productMap = {};
        products.forEach((p) => { productMap[p.id] = p.name; });

        // Enrich order items with product names
        const enrichedItems = orderItems.map((item) => ({
            ...item,
            name: productMap[item.product_id] || `Product #${item.product_id}`,
        }));

        // Create admin notification in DB
        await pool.query(
            'INSERT INTO admin_notifications (type, title, message, order_id) VALUES (?, ?, ?, ?)',
            [
                'new_order',
                `New Order #${orderId}`,
                `${req.user.name} (${req.user.email}) placed an order for ${formatCurrency(totalAmount)}. Items: ${enrichedItems.map(i => i.name).join(', ')}.`,
                orderId,
            ]
        );

        // Fire emails asynchronously — do NOT await (order response returns immediately)
        sendOrderEmails({
            orderId,
            customerName: req.user.name,
            customerEmail: req.user.email,
            orderItems: enrichedItems,
            totalAmount,
            orderDate: new Date(),
        }).catch((err) => {
            console.error(`❌ Email dispatch error for Order #${orderId}:`, err.message);
        });
    } catch (emailError) {
        // Log but never fail the order due to email issues
        console.error(`❌ Email preparation error for Order #${orderId}:`, emailError.message);
    }

    res.status(201).json({ id: orderId, message: 'Order placed successfully' });
});

const getMyOrders = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(rows);
});

const getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, req.user.id]);
    
    if (orders.length > 0) {
        const order = orders[0];
        const [items] = await pool.query('SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [id]);
        res.json({ ...order, items });
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

const getAllOrders = asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC');
    res.json(rows);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Order status updated' });
});

module.exports = { addOrderItems, getMyOrders, getOrderById, getAllOrders, updateOrderStatus };
