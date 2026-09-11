import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../auth/const.auth';
import { productControllers } from './controller.product';
import { productValidations } from './validation.product';

const router = express.Router();

// POST /api/products  — admin / superAdmin
router.post(
    '/',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(productValidations.createProductValidationSchema),
    productControllers.createProduct,
);

// GET /api/products  — public (supports ?search, ?category, ?status, ?isFeatured, ?minPrice, ?maxPrice, ?sort, ?page, ?limit)
router.get('/', productControllers.getAllProducts);

// GET /api/products/:productId  — public (accepts ObjectId or slug)
router.get('/:productId', productControllers.getSingleProduct);

// PATCH /api/products/:productId  — admin / superAdmin
router.patch(
    '/:productId',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(productValidations.updateProductValidationSchema),
    productControllers.updateProduct,
);

// PATCH /api/products/:productId/toggle-featured  — admin / superAdmin
router.patch(
    '/:productId/toggle-featured',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    productControllers.toggleFeatured,
);

// PATCH /api/products/:productId/variants/:variantId  — admin / superAdmin
router.patch(
    '/:productId/variants/:variantId',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(productValidations.updateVariantValidationSchema),
    productControllers.updateVariant,
);

// DELETE /api/products/:productId  — admin / superAdmin
router.delete(
    '/:productId',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    productControllers.deleteProduct,
);

// Reviews now live in their own module — see /api/v1/reviews
// (POST /reviews, GET /reviews/product/:productId).

export const productRoutes = router;
