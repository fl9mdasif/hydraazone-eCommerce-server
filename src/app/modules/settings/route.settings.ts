import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../auth/const.auth';
import { settingsControllers } from './controller.settings';
import { settingsValidations } from './validation.settings';

const router = express.Router();

// GET /api/v1/settings — public
router.get('/', settingsControllers.getSettings);

// PATCH /api/v1/settings — admin / superAdmin only
router.patch(
    '/',
    auth(USER_ROLE.admin, USER_ROLE.superAdmin),
    validateRequest(settingsValidations.updateSettingsValidationSchema),
    settingsControllers.updateSettings,
);

export const settingsRoutes = router;
