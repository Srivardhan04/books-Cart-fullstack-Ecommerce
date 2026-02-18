const asyncHandler = require('express-async-handler');
const pool = require('../config/db');

const getProducts = asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
});

const getProductById = asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length > 0) {
        res.json(rows[0]);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows > 0) {
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

const createProduct = asyncHandler(async (req, res) => {
    const { name, price, description, image_url, stock } = req.body;
    const [result] = await pool.query('INSERT INTO products (name, price, description, image_url, stock) VALUES (?, ?, ?, ?, ?)', [name, price, description, image_url, stock]);
    res.status(201).json({ id: result.insertId, name, price, description, image_url, stock });
});

const updateProduct = asyncHandler(async (req, res) => {
    const { name, price, description, image_url, stock } = req.body;
    const [result] = await pool.query('UPDATE products SET name = ?, price = ?, description = ?, image_url = ?, stock = ? WHERE id = ?', [name, price, description, image_url, stock, req.params.id]);
    if (result.affectedRows > 0) {
        res.json({ id: req.params.id, name, price, description, image_url, stock });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = { getProducts, getProductById, deleteProduct, createProduct, updateProduct };
