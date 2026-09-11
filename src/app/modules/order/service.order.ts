import httpStatus from 'http-status';
import AppError from '../../errors/AppErrors';
import { Product } from '../product/model.product';
import { Order } from './model.order';
import { Cart } from '../cart/model.cart';
import { generateOrderNumber } from './utils.order';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_CHARGE } from './const.order';
import { TOrder, TOrderStatus, TPaymentStatus } from './interface.order';
import { userServices } from '../user/service.user';
import { settingsServices } from '../settings/service.settings';
import { User } from '../auth/model.auth';
import { sendEmail } from '../../utils/sendEmail';
import { createAdminOrderNotificationEmail, createUserOrderShippedEmail } from '../../helpers/emailTemplate';
import { sendPurchaseConversionEvent } from '../../helpers/metaConversionApi';
import config from '../../config';

// ── Place Order ────────────────────────────────────────────────────────────────
const placeOrder = async (
    userId: string,
    payload: {
        items: { productId: string; variantId: string; quantity: number }[];
        shippingAddress: TOrder['shippingAddress'];
        paymentMethod: TOrder['paymentMethod'];
        discount?: number;
        note?: string;
    },
) => {
    const { items, shippingAddress, paymentMethod, note, discount = 0 } = payload;

    // 1. Validate stock & build order items
    let subtotal = 0;
    const orderItems: TOrder['items'] = [];

    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                `Product not found: ${item.productId}`,
                'Product not found',
            );
        }

        const variant = product.variants.id(item.variantId);
        if (!variant) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                'Variant not found',
                'Variant not found',
            );
        }

        if (!variant.isAvailable || variant.stock < item.quantity) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Insufficient stock for ${product.name} – ${variant.name}`,
                'Insufficient stock',
            );
        }

        const price = variant.discountPrice ?? variant.price;
        const totalPrice = price * item.quantity;
        subtotal += totalPrice;

        orderItems.push({
            product: product._id,
            variant: {
                variantId: variant._id,
                name: variant.name,
                sku: variant.sku,
                price: variant.price,
                discountPrice: variant.discountPrice ?? undefined,
            },
            quantity: item.quantity,
            totalPrice,
        });
    }

    // 2. Calculate totals — shipping rate/threshold come from the admin-editable
    // Settings doc when set, falling back to the hardcoded constants otherwise
    // so orders keep working even before an admin ever touches /settings.
    const settings = await settingsServices.getSettings();
    const shippingRate = settings.shippingRate ?? SHIPPING_CHARGE;
    const freeShippingThreshold = settings.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD;
    const shippingCharge = subtotal >= freeShippingThreshold ? 0 : shippingRate;
    const totalAmount = subtotal + shippingCharge - discount;

    // 3. Create order
    const order = await Order.create({
        user: userId,
        orderNumber: generateOrderNumber(),
        items: orderItems,
        shippingAddress,
        paymentMethod,
        subtotal,
        shippingCharge,
        discount,
        totalAmount,
        note,
        statusHistory: [{ status: 'pending', note: 'Order placed' }],
    });

    // 4. Deduct stock
    for (const item of items) {
        await Product.findOneAndUpdate(
            { _id: item.productId, 'variants._id': item.variantId },
            { $inc: { 'variants.$.stock': -item.quantity } },
        );
    }

    // 5. Auto-save the shipping address to the user's profile (fire-and-forget)
    userServices.autoSaveAddressFromOrder(userId, shippingAddress);

    // 6. Clear cart items after successful order
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    // // 7. Notify Admin via Email (Fire-and-forget)
    // (async () => {
    //     const populatedOrder = await Order.findById(order._id).populate('items.product', 'name thumbnail');
    //     if (populatedOrder) {
    //         sendEmail(
    //             config.admin_email as string,
    //             `New Order Received: #${order.orderNumber}`,
    //             createAdminOrderNotificationEmail(populatedOrder),
    //         );
    //     }
    // })();

    // 8. Facebook Conversion API — Purchase event (fire-and-forget, never blocks checkout)
    (async () => {
        const user = await User.findById(userId).select('email');
        await sendPurchaseConversionEvent({
            pixelId: settings.fbPixelId,
            accessToken: settings.fbConversionApiToken,
            email: user?.email,
            phone: shippingAddress.phone,
            value: totalAmount,
        });
    })();

    return order;
};

// ── My Orders (logged-in user) ─────────────────────────────────────────────────
const getMyOrders = async (userId: string) => {
    const orders = await Order.find({ user: userId })
        .populate('items.product', 'name thumbnail slug')
        .sort({ createdAt: -1 });
    return orders;
};

// ── Single Order ───────────────────────────────────────────────────────────────
const getOrderById = async (orderId: string, requesterId: string, requesterRole: string) => {
    const order = await Order.findById(orderId)
        .populate('user', 'name email phone')
        .populate('items.product', 'name thumbnail slug');

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, 'Order not found', 'Order not found');
    }

    // Users can only view their own orders; admins can see all
    if (
        (order.user as any)._id.toString() !== requesterId &&
        requesterRole !== 'admin' &&
        requesterRole !== 'superAdmin'
    ) {
        throw new AppError(httpStatus.FORBIDDEN, 'Forbidden', 'Access denied');
    }

    return order;
};

// ── All Orders (admin) ─────────────────────────────────────────────────────────
const getAllOrders = async (query: Record<string, unknown>) => {
    const { status, page = 1, limit = 20 } = query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (status) filter.orderStatus = status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

    if (query.search) {
        const searchTerm = query.search as string;
        filter.$or = [
            { orderNumber: { $regex: searchTerm, $options: 'i' } },
            { 'shippingAddress.fullName': { $regex: searchTerm, $options: 'i' } },
            { 'shippingAddress.phone': { $regex: searchTerm, $options: 'i' } },
        ];
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('user', 'name email phone')
            .populate('items.product', 'name thumbnail slug')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Order.countDocuments(filter),
    ]);

    return {
        data: orders,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    };
};

// ── Update Order Status (admin) ────────────────────────────────────────────────
const updateOrderStatus = async (
    orderId: string,
    status: TOrderStatus,
    note?: string,
) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, 'Order not found', 'Order not found');
    }

    order.orderStatus = status;
    order.statusHistory.push({ status, note, changedAt: new Date() });

    if (status === 'delivered') order.deliveredAt = new Date();

    if (status === 'cancelled') {
        order.cancelledAt = new Date();
        order.cancelReason = note;

        // Restore stock on cancellation
        for (const item of order.items) {
            await Product.findOneAndUpdate(
                { _id: item.product, 'variants._id': item.variant?.variantId },
                { $inc: { 'variants.$.stock': item.quantity } },
            );
        }
    }

    await order.save();

    // Notify User if status is "shipped"
    if (status === 'shipped') {
        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'name email')
            .populate('items.product', 'name thumbnail');

        if (populatedOrder && (populatedOrder.user as any)?.email) {
            sendEmail(
                (populatedOrder.user as any).email,
                `Your Order #${order.orderNumber} has been Shipped!`,
                createUserOrderShippedEmail(populatedOrder),
            );
        }
    }
    return order;
};

// ── Update Payment Status (admin) ──────────────────────────────────────────────
const updatePaymentStatus = async (
    orderId: string,
    paymentStatus: TPaymentStatus,
    transactionId?: string,
) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, 'Order not found', 'Order not found');
    }

    order.paymentStatus = paymentStatus;
    if (transactionId) order.transactionId = transactionId;

    await order.save();
    return order;
};

// ── Cancel Order (by user, only if still pending) ──────────────────────────────
const cancelOrder = async (orderId: string, userId: string, reason?: string) => {
    console.log(orderId, userId, reason);

    const order = await Order.findOne({ _id: orderId, user: userId });
    // console.log(order);

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, 'Order not found', 'Order not found');
    }

    if (!['pending', 'confirmed'].includes(order.orderStatus as string)) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Order cannot be cancelled at this stage',
            'Cannot cancel',
        );
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    order.statusHistory.push({ status: 'cancelled', note: reason ?? 'Cancelled by customer', changedAt: new Date() });

    // Restore stock
    for (const item of order.items) {
        await Product.findOneAndUpdate(
            { _id: item.product, 'variants._id': item.variant?.variantId },
            { $inc: { 'variants.$.stock': item.quantity } },
        );
    }

    await order.save();
    return order;
};

// ── Analytics ────────────────────────────────────────────────────────────────
const getSalesAnalytics = async (period: 'daily' | 'monthly' | 'yearly') => {
    let format = '%Y-%m-%d';
    if (period === 'monthly') format = '%Y-%m';
    if (period === 'yearly') format = '%Y';

    const pipeline = [
        {
            $match: {
                orderStatus: 'delivered',
            },
        },
        {
            $group: {
                _id: { $dateToString: { format, date: '$createdAt' } },
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 as const },
        },
    ];

    const result = await Order.aggregate(pipeline);

    return result.map((item) => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.orders,
    }));
};

// ── Admin dashboard summary ────────────────────────────────────────────────────
// A single snapshot for a dashboard header: total orders, delivered revenue,
// pending order count, and variants running low on stock.
const getDashboardSummary = async () => {
    const settings = await settingsServices.getSettings();
    const lowStockThreshold = settings.lowStockThreshold ?? 5;

    const [totalOrders, pendingOrders, revenueResult, lowStockVariants] = await Promise.all([
        Order.countDocuments({}),
        Order.countDocuments({ orderStatus: 'pending' }),
        Order.aggregate([
            { $match: { orderStatus: 'delivered' } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
        ]),
        Product.aggregate([
            { $unwind: '$variants' },
            { $match: { 'variants.stock': { $lte: lowStockThreshold }, 'variants.isAvailable': true } },
            {
                $project: {
                    _id: 0,
                    productId: '$_id',
                    productName: '$name',
                    variantId: '$variants._id',
                    variantName: '$variants.name',
                    sku: '$variants.sku',
                    stock: '$variants.stock',
                },
            },
            { $sort: { stock: 1 } },
        ]),
    ]);

    return {
        totalOrders,
        pendingOrders,
        totalRevenue: revenueResult[0]?.totalRevenue ?? 0,
        lowStockThreshold,
        lowStockVariants,
    };
};

export const orderServices = {
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
