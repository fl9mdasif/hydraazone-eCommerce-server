import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';
import { authServices } from './service.auth';

const registerUser = catchAsync(async (req, res) => {
  // console.log(req.body);

  const result = await authServices.registerUser(req.body);

  response.createSendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});


const loginUser = catchAsync(async (req, res) => {
  const result = await authServices.loginUser(req.body);

  const { data, accessToken, refreshToken } = result;

  // Set refresh token in cookie if available
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax', // Use lax for better compatibility during development
    });
  }

  // Set access token in cookie
  res.cookie('accessToken', accessToken, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  });

  response.createSendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User login successfully!',
    data: {
      user: data.jwtPayload,
      accessToken,
    },
  });
});

const logoutUser = catchAsync(async (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  response.createSendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User logged out successfully!',
    data: null,
  });
});

// guest checkout — find-or-create user with real email, return token
const guestCheckout = catchAsync(async (req, res) => {
  const { email, fullName, phone } = req.body;
  const result = await authServices.guestCheckout(email, fullName, phone);

  const { accessToken, refreshToken } = result;

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  res.cookie('accessToken', accessToken, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  });

  response.createSendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Guest checkout initialized successfully',
    data: {
      user: result.user,
      accessToken,
    },
  });
});

// // change password
const changePassword = catchAsync(async (req, res) => {
  const { ...passwordData } = req.body;
  // console.log('controler', req.user, req.body);
  const result = await authServices.changePassword(req.user, passwordData);

  response.createSendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password is updated successfully!',
    data: {
      data: result,
    },
  });
});

// refresh
const refreshToken = catchAsync(async (req, res) => {
  // Retrieve refreshToken
  const { refreshToken } = req.cookies;

  // const refreshToken = localStorage.getItem('refreshToken') as string | null;

  if (refreshToken) {
    // console.log('r', refreshToken);
    const result = await authServices.refreshToken(refreshToken);

    response.createSendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Refresh token is retrieved successfully!',
      data: result,
    });
  }
});

export const authControllers = {
  loginUser,
  registerUser,
  changePassword,
  refreshToken,
  logoutUser,
  guestCheckout,
};
