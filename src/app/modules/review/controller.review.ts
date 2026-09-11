import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';
import { reviewServices } from './service.review';

// POST /api/v1/reviews — user, must own a delivered order containing the item
const createReview = catchAsync(async (req, res) => {
    const result = await reviewServices.createReview(req.user._id, req.body);

    response.createSendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Review submitted successfully, pending approval',
        data: result,
    });
});

// GET /api/v1/reviews/product/:productId — public, approved only
const getProductReviews = catchAsync(async (req, res) => {
    const result = await reviewServices.getProductReviews(req.params.productId, req.query);

    response.getSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reviews retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});

// GET /api/v1/reviews — admin, optional ?status=pending|approved|rejected
const getAllReviews = catchAsync(async (req, res) => {
    const result = await reviewServices.getAllReviews(req.query);

    response.getSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reviews retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});

// PATCH /api/v1/reviews/:reviewId/status — admin
const updateReviewStatus = catchAsync(async (req, res) => {
    const result = await reviewServices.updateReviewStatus(req.params.reviewId, req.body.status);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Review ${result.status}`,
        data: result,
    });
});

export const reviewControllers = {
    createReview,
    getProductReviews,
    getAllReviews,
    updateReviewStatus,
};
