import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../auth/const.auth';
import { reviewControllers } from './controller.review';
import { reviewValidations } from './validation.review';

const router = express.Router();

// GET /api/v1/reviews/product/:productId — public (must come before admin-only '/')
router.get('/product/:productId', reviewControllers.getProductReviews);

// POST /api/v1/reviews — user submits a review for a delivered order item
router.post(
    '/',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(reviewValidations.createReviewValidationSchema),
    reviewControllers.createReview,
);

// GET /api/v1/reviews — admin: list all reviews (optional ?status=)
router.get(
    '/',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    reviewControllers.getAllReviews,
);

// PATCH /api/v1/reviews/:reviewId/status — admin: approve/reject
router.patch(
    '/:reviewId/status',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(reviewValidations.updateReviewStatusValidationSchema),
    reviewControllers.updateReviewStatus,
);

export const reviewRoutes = router;
