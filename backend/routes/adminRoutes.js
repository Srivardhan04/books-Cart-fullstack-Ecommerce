const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getAdminOrders,
    getAdminOrderDetail,
    getCustomers,
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

// All admin routes require authentication + admin role
router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderDetail);
router.get('/customers', getCustomers);

module.exports = router;
