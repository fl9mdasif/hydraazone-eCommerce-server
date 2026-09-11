import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { orderRateLimiter } from '../../middlewares/rateLimiters';
import { USER_ROLE } from '../auth/const.auth';
import { orderControllers } from './controller.order';
import { orderValidations } from './validation.order';

const router = express.Router();

// ── User routes ────────────────────────────────────────────────────────────────

// POST /api/orders  — place a new order
router.post(
    '/',
    orderRateLimiter,
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(orderValidations.placeOrderValidationSchema),
    orderControllers.placeOrder,
);

// GET /api/orders/my-orders  — logged-in user's orders (must come before /:orderId)
router.get(
    '/my-orders',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    orderControllers.getMyOrders,
);

// GET /api/orders/:orderId  — single order detail (owner or admin)
router.get(
    '/:orderId',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    orderControllers.getOrderById,
);

// PATCH /api/orders/:orderId/cancel  — user cancels their own order
router.patch(
    '/:orderId/cancel',
    auth(USER_ROLE.user),
    orderControllers.cancelOrder,
);

// ── Admin routes ───────────────────────────────────────────────────────────────

// GET /api/orders/analytics/sales  — admin charting data
router.get(
    '/analytics/sales',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    orderControllers.getSalesAnalytics,
);

// GET /api/orders/analytics/dashboard  — admin dashboard summary (orders, revenue, low stock)
router.get(
    '/analytics/dashboard',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    orderControllers.getDashboardSummary,
);

// GET /api/orders  — all orders (paginated + filterable by status)
router.get(
    '/',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    orderControllers.getAllOrders,
);

// PATCH /api/orders/:orderId/status  — update lifecycle status
router.patch(
    '/:orderId/status',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(orderValidations.updateOrderStatusValidationSchema),
    orderControllers.updateOrderStatus,
);

// PATCH /api/orders/:orderId/payment-status  — update payment status
router.patch(
    '/:orderId/payment-status',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(orderValidations.updatePaymentStatusValidationSchema),
    orderControllers.updatePaymentStatus,
);

export const orderRoutes = router;
