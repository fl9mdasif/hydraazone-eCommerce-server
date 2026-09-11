import auth from '../../middlewares/auth';
import { USER_ROLE } from '../auth/const.auth';
import { generateUploadUrl } from './controller.upload';
import { Router } from 'express';

const router = Router();

// This endpoint MUST be protected — a pre-signed S3 PUT URL handed to an
// anonymous caller is an open write-anywhere-in-the-bucket abuse vector.
// Any authenticated role can request one: regular users need it for review
// photos, admins/superAdmins for product/category images.
router.post(
  '/generate-upload-url',
  auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
  generateUploadUrl
);

export const ImageUploads = router;