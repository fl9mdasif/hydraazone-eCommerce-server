import { z } from 'zod';

export const loginValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string({ message: 'Password is required' }),
  }),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z.string({
      message: 'Old password is required',
    }),
    newPassword: z.string({ message: 'Password is required' }),
  }),
});


const userRegistrationValidation = z.object({
  body: z.object({
    username: z.string().min(1).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(30),
    role: z.enum(['user', 'admin', 'superAdmin']).default('user'),
    contactNumber: z.string(),
    profilePicture: z.string().optional(),
    address: z.string().optional(),
  }),
});

// const refreshTokenValidationSchema = z.object({
//   cookies: z.object({
//     refreshToken: z.string({
//       message: 'Refresh token is required!',
//     }),
//   }),
// });

export const authValidations = {
  userRegistrationValidation,
  loginValidationSchema,
  changePasswordValidationSchema,
  // refreshTokenValidationSchema,
};
