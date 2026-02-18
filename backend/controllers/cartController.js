const asyncHandler = require('express-async-handler');
const pool = require('../config/db');

const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    // Get product stock
    const [products] = await pool.query('SELECT stock, name FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
        res.status(404);
        throw new Error('Product not found');
    }
    const product = products[0];

    // Check if already in cart
    const [existing] = await pool.query('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [userId, productId]);
    
    const newQuantity = existing.length > 0 ? existing[0].quantity + quantity : quantity;

    if (product.stock < newQuantity) {
        res.status(400);
        throw new Error(`Only ${product.stock} items in stock`);
    }

    if (existing.length > 0) {
        await pool.query('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?', [newQuantity, userId, productId]);
    } else {
        await pool.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, productId, quantity]);
    }
    res.status(201).json({ message: 'Added to cart' });
});

const getCartItems = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?', [userId]);
    res.json(rows);
});

const removeFromCart = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: 'Removed from cart' });
});

const updateCartQuantity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    // Get product stock for this cart item
    const [cartItems] = await pool.query('SELECT c.product_id, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = ?', [id]);
    if (cartItems.length > 0) {
        if (cartItems[0].stock < quantity) {
            res.status(400);
            throw new Error(`Only ${cartItems[0].stock} items in stock`);
        }
    }

    await pool.query('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, id, req.user.id]);
    res.json({ message: 'Quantity updated' });
});

module.exports = { addToCart, getCartItems, removeFromCart, updateCartQuantity };
