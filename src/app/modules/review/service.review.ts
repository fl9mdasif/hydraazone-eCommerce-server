import httpStatus from 'http-status';
import { Types } from 'mongoose';
import AppError from '../../errors/AppErrors';
import { Order } from '../order/model.order';
import { Product } from '../product/model.product';
import { Review } from './model.review';
import { TReviewStatus } from './interface.review';

// Recomputes a product's aggregate rating/reviewCount from its APPROVED
// reviews only, so a rejection or a later status change never leaves the
// public rating stuck on a stale running average.
const recalcProductRating = async (productId: Types.ObjectId | string) => {
    const [stats] = await Review.aggregate([
        { $match: { product: new Types.ObjectId(productId), status: 'approved' } },
        { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    await Product.findByIdAndUpdate(productId, {
        rating: stats ? Number(stats.avgRating.toFixed(1)) : 0,
        reviewCount: stats ? stats.count : 0,
    });
};

// ── Create a review — only for a delivered order the requester actually owns ───
const createReview = async (
    userId: string,
    payload: {
        productId: string;
        orderId: string;
        variantId: string;
        rating: number;
        comment?: string;
        photos?: string[];
    },
) => {
    const { productId, orderId, variantId, rating, comment, photos } = payload;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Order not found',
            'No such order for this account',
        );
    }

    if (order.orderStatus !== 'delivered') {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You can only review products from a delivered order',
            'Order not delivered',
        );
    }

    const item = order.items.find(
        (i) =>
            i.product.toString() === productId &&
            i.variant?.variantId?.toString() === variantId,
    );

    if (!item) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'This product/variant was not part of the given order',
            'Item not found in order',
        );
    }

    if (item.isReviewed) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You have already reviewed this item',
            'Already reviewed',
        );
    }

    let review;
    try {
        review = await Review.create({
            user: userId,
            product: productId,
            order: orderId,
            variantId,
            rating,
            comment,
            photos,
            status: 'pending',
        });
    } catch (err: any) {
        if (err?.code === 11000) {
            throw new AppError(
                httpStatus.CONFLICT,
                'You have already reviewed this item',
                'Duplicate review',
            );
        }
        throw err;
    }

    await Order.findOneAndUpdate(
        { _id: orderId, 'items.product': productId, 'items.variant.variantId': variantId },
        { $set: { 'items.$.isReviewed': true } },
    );

    return review;
};

// ── Public: approved reviews for a product ──────────────────────────────────────
const getProductReviews = async (productId: string, query: Record<string, unknown>) => {
    const { page = 1, limit = 20 } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const filter = { product: productId, status: 'approved' as TReviewStatus };

    const [reviews, total] = await Promise.all([
        Review.find(filter)
            .populate('user', 'username profilePicture')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Review.countDocuments(filter),
    ]);

    return {
        data: reviews,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    };
};

// ── Admin: all reviews, optionally filtered by status ───────────────────────────
const getAllReviews = async (query: Record<string, unknown>) => {
    const { status, page = 1, limit = 20 } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const [reviews, total] = await Promise.all([
        Review.find(filter)
            .populate('user', 'username email')
            .populate('product', 'name slug thumbnail')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Review.countDocuments(filter),
    ]);

    return {
        data: reviews,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    };
};

// ── Admin: approve / reject a review ────────────────────────────────────────────
const updateReviewStatus = async (reviewId: string, status: TReviewStatus) => {
    const review = await Review.findByIdAndUpdate(
        reviewId,
        { status },
        { new: true },
    );

    if (!review) {
        throw new AppError(httpStatus.NOT_FOUND, 'Review not found', 'Review not found');
    }

    // Recalculate regardless of direction (approve, reject, or a re-review of
    // an earlier decision) so the product's public rating always matches the
    // current set of approved reviews.
    await recalcProductRating(review.product);

    return review;
};

export const reviewServices = {
    createReview,
    getProductReviews,
    getAllReviews,
    updateReviewStatus,
};
