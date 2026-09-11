/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { User } from './model.auth';
import { TLoginUser, TUser } from './interface.auth';
import AppError from '../../errors/AppErrors';
import config from '../../config';
import bcrypt from 'bcrypt';
import { createToken, verifyToken } from './utils.auth';
import { JwtPayload } from 'jsonwebtoken';

// register
const registerUser = async (payload: TUser) => {
  // create
  const register = await User.create(payload);
  return register;
};

// guest checkout — create a brand-new account for a first-time email and return
// an access token. If the email already belongs to an existing account, this
// does NOT log them in (no password was provided/checked) — it tells the
// caller to use the normal login flow instead, so a known email address can
// never be used to silently obtain a session for someone else's account.
const guestCheckout = async (email: string, fullName: string, phone: string) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      'An account already exists for this email. Please log in to continue.',
      'Account already exists',
    );
  }

  const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
  const password = config.default_user_pass as string;

  // Create new user with a default password — password will be hashed by the pre-save hook.
  // The customer is expected to log in with this password afterwards and change it.
  const user = await User.create({
    username,
    email,
    contactNumber: phone,
    password,
    role: 'user',
  });

  // Issue access token
  const jwtPayload: any = {
    _id: user._id as string,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  return { accessToken, refreshToken, user: jwtPayload };
};

// login
const loginUser = async (payload: TLoginUser) => {
  //
  // console.log(payload)
  // 1. checking if the user is exist
  const user = await User.isUserExists(payload.email);
  // console.log(user);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, '', `This user is not found !'`);
  }

  //   2. checking if the password is correct
  if (!(await User.isPasswordMatched(payload?.password, user?.password)))
    throw new AppError(
      httpStatus.FORBIDDEN,
      `Password of '${user.role}' do not matched`,
      'password',
    );
  // console.log(user);

  // 3. create token and sent to the client
  const jwtPayload: any = {
    _id: user?._id as string,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  // create token
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  // refresh token
  const refreshToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  return {
    data: { jwtPayload },
    accessToken,
    refreshToken,
  };
};

// change password
const changePassword = async (
  userData: JwtPayload,
  payload: { oldPassword: string; newPassword: string },
) => {
  // 01. checking if the user is exist
  const user = await User.isUserExists(userData.email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !', '');
  }

  // 02. checking if the password is correct
  if (!(await User.isPasswordMatched(payload.oldPassword, user?.password)))
    throw new AppError(
      httpStatus.FORBIDDEN,
      `${user.role}'s Password do not matched`,
      '',
    );
  // 03 Check if the new password is different from the current password
  if (payload.oldPassword === payload.newPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Password change failed. Ensure the new password is unique and not among the last 2 used',
      '',
    );
    return null;
  }

  // 04 hash new password
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_round),
  );

  // update password
  await User.findOneAndUpdate(
    {
      email: userData.email,
      role: userData.role,
    },
    {
      password: newHashedPassword,
      passwordChangedAt: new Date(),
    },
    { new: true, runValidators: true },
  );
  return user;
};


// create refresh token
const refreshToken = async (token: string) => {
  // console.log(token);
  // checking if the given token is valid

  const decoded = verifyToken(
    token,
    config.jwt_access_secret as string,
  ) as JwtPayload;

  const { iat, username } = decoded;

  // checking if the user is exist
  const user = await User.isUserExists(username);
  // console.log(decoded);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
  }

  if (
    user.passwordChangedAt &&
    User.isJWTIssuedBeforePasswordChanged(user.passwordChangedAt, iat as number)
  ) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized !');
  }

  const jwtPayload: any = {
    username: user.username,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  return {
    accessToken,
  };
};

export const authServices = {
  loginUser,
  registerUser,
  changePassword,
  refreshToken,
  guestCheckout,
};
