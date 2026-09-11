import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authValidations } from './validation.auth';
import { authControllers } from './controller.auth';
import auth from '../../middlewares/auth';
import { authRateLimiter } from '../../middlewares/rateLimiters';
import { USER_ROLE } from './const.auth';

const router = express.Router();

// register a user
router.post(
  '/register',
  authRateLimiter,
  validateRequest(authValidations.userRegistrationValidation),
  authControllers.registerUser,
);

// login a user
router.post(
  '/login',
  authRateLimiter,
  validateRequest(authValidations.loginValidationSchema),
  authControllers.loginUser,
);

// change password
router.post(
  '/change-password',
  authRateLimiter,
  auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
  validateRequest(authValidations.changePasswordValidationSchema),
  authControllers.changePassword,
);

// logout a user
router.post('/logout', authControllers.logoutUser);

// refresh token
router.post('/refresh-token', authControllers.refreshToken);

// guest checkout — find-or-create a real account by email, no login required
router.post('/guest-checkout', authRateLimiter, authControllers.guestCheckout);

export const authRoute = router;
