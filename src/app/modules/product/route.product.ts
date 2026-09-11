// import express from 'express';
// import { projectControllers } from './controller.projects';
// import { USER_ROLE } from '../auth/const.auth';
// import auth from '../../middlewares/auth';
// import validateRequest from '../../middlewares/validateRequest';

// const router = express.Router();

// router.post(
//   '/create-project',
//   auth(USER_ROLE.user, USER_ROLE.superAdmin),
//   // validateRequest(ShoesValidation.CreateShoesValidationSchema),
//   projectControllers.createProject,
// );

// router.get(
//   '/',
//   // auth(USER_ROLE.buyer, USER_ROLE.seller, USER_ROLE.superAdmin),

//   projectControllers.getAllProjects,
// );
// // get single
// router.get(
//   '/:projectId',
//   // auth(USER_ROLE.buyer, USER_ROLE.seller, USER_ROLE.superAdmin),
//   projectControllers.getSingleProject,
// );
// // delete
// router.delete(
//   '/:projectId',
//   // auth(USER_ROLE.superAdmin),
//   projectControllers.deleteProject,
// );

// router.put(
//   '/:projectId',
//   // auth(USER_ROLE.seller, USER_ROLE.superAdmin),
//   // validateRequest(ShoesValidation.UpdateShoesValidationSchema),
//   projectControllers.updateProject,
// );



// export const projectRoutes = router;
