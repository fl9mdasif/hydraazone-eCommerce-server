import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../auth/const.auth';
import { homepageControllers } from './controller.homepage';
import { homepageValidations } from './validation.homepage';

const router = express.Router();

// GET /api/v1/homepage — public
router.get('/', homepageControllers.getHomepage);

// PATCH /api/v1/homepage — admin / superAdmin only
router.patch(
    '/',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(homepageValidations.updateHomepageValidationSchema),
    homepageControllers.updateHomepage,
);

export const homepageRoutes = router;
