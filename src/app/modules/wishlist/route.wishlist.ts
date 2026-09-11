import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../auth/const.auth';
import { wishlistControllers } from './controller.wishlist';
import { wishlistValidations } from './validation.wishlist';

const router = express.Router();

router.get(
    '/',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    wishlistControllers.getWishlist,
);

router.post(
    '/',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(wishlistValidations.addToWishlistValidationSchema),
    wishlistControllers.addToWishlist,
);

router.delete(
    '/:productId',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
    wishlistControllers.removeFromWishlist,
);

export const wishlistRoutes = router;
