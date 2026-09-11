import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../auth/const.auth';
import { cartControllers } from './controller.cart';
import { cartValidations } from './validation.cart';

const router = express.Router();

router.post(
    '/',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(cartValidations.addToCartValidationSchema),
    cartControllers.addToCart,
);

router.get(
    '/',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    cartControllers.getCart,
);

router.patch(
    '/:productId/:variantId',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(cartValidations.updateCartItemValidationSchema),
    cartControllers.updateCartItemQuantity,
);

router.delete(
    '/:productId/:variantId',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    cartControllers.removeFromCart,
);

router.delete(
    '/',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    cartControllers.clearCart,
);

export const cartRoutes = router;
