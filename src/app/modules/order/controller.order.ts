import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';
import { orderServices } from './service.order'; 

// POST /api/orders  — logged-in user places an order
const placeOrder = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const result = await orderServices.placeOrder(userId, req.body);

    response.createSendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Order placed successfully',
        data: result,
    });
});

// GET /api/orders/my-orders  — logged-in user's own orders
const getMyOrders = catchAsync(async (req, res) => {
    const result = await orderServices.getMyOrders(req.user._id);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
    });
});

// GET /api/orders/:orderId  — single order (owner or admin)
const getOrderById = catchAsync(async (req, res) => {
    const result = await orderServices.getOrderById(
        req.params.orderId,
        req.user._id,
        req.user.role,
    );

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order retrieved successfully',
        data: result,
    });
});

// GET /api/orders  — admin: all orders with optional filters & pagination
const getAllOrders = catchAsync(async (req, res) => {
    const result = await orderServices.getAllOrders(req.query);

    response.getSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});

// PATCH /api/orders/:orderId/status  — admin updates lifecycle status
const updateOrderStatus = catchAsync(async (req, res) => {
    const { status, note } = req.body;
    const result = await orderServices.updateOrderStatus(req.params.orderId, status, note);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order status updated successfully',
        data: result,
    });
});

// PATCH /api/orders/:orderId/payment-status  — admin updates payment status
const updatePaymentStatus = catchAsync(async (req, res) => {
    const { paymentStatus, transactionId } = req.body;
    const result = await orderServices.updatePaymentStatus(
        req.params.orderId,
        paymentStatus,
        transactionId,
    );

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment status updated successfully',
        data: result,
    });
});

// PATCH /api/orders/:orderId/cancel  — logged-in user cancels their own order
const cancelOrder = catchAsync(async (req, res) => {
    const { reason } = req.body;

    const result = await orderServices.cancelOrder(req.params.orderId, req.user._id, reason);


    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order cancelled successfully',
        data: result,
    });
});

// GET /api/orders/analytics/sales — admin gets sales chart data
const getSalesAnalytics = catchAsync(async (req, res) => {
    const period = (req.query.period as 'daily' | 'monthly' | 'yearly') || 'monthly';
    const result = await orderServices.getSalesAnalytics(period);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Sales analytics retrieved successfully',
        data: result,
    });
});

// GET /api/orders/analytics/dashboard — admin dashboard summary
const getDashboardSummary = catchAsync(async (req, res) => {
    const result = await orderServices.getDashboardSummary();

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Dashboard summary retrieved successfully',
        data: result,
    });
});

export const orderControllers = {
    placeOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    getSalesAnalytics,
    getDashboardSummary,
};