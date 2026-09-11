import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';
import { userServices } from './service.user';

// GET /api/v1/users/addresses
const getAddresses = catchAsync(async (req, res) => {
    const result = await userServices.getAddresses(req.user._id);
    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Saved addresses retrieved successfully',
        data: result,
    });
});

// POST /api/v1/users/addresses
const addAddress = catchAsync(async (req, res) => {
    const result = await userServices.addAddress(req.user._id, req.body);
    response.createSendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Address added successfully',
        data: result,
    });
});

// PATCH /api/v1/users/addresses/:id
const updateAddress = catchAsync(async (req, res) => {
    const result = await userServices.updateAddress(
        req.user._id,
        req.params.id,
        req.body,
    );
    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Address updated successfully',
        data: result,
    });
});

// DELETE /api/v1/users/addresses/:id
const deleteAddress = catchAsync(async (req, res) => {
    const result = await userServices.deleteAddress(req.user._id, req.params.id);
    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Address deleted successfully',
        data: result,
    });
});

// PATCH /api/v1/users/addresses/:id/default
const setDefaultAddress = catchAsync(async (req, res) => {
    const result = await userServices.setDefaultAddress(req.user._id, req.params.id);
    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Default address updated',
        data: result,
    });
});

// ── SUPERADMIN CONTROLLERS ─────────────────────────────────────────────────────

// GET /api/v1/users   (superAdmin only)
const getAllUsers = catchAsync(async (req, res) => {
    const { search, role, page, limit, isBlocked } = req.query as Record<string, string>;
    const result = await userServices.getAllUsers({
        search,
        role,
        isBlocked,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Users retrieved successfully',
        data: result,
    });
});

// PATCH /api/v1/users/:id/role   (superAdmin only)
const updateUserRole = catchAsync(async (req, res) => {
    const result = await userServices.updateUserRole(
        req.params.id,
        req.user._id,
        req.body.role,
    );
    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User role updated successfully',
        data: result,
    });
});

// PATCH /api/v1/users/:id/block   (superAdmin only)
const toggleBlockUser = catchAsync(async (req, res) => {
    const result = await userServices.toggleBlockUser(req.params.id, req.user._id);
    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `User ${result?.isBlocked ? 'blocked' : 'unblocked'} successfully`,
        data: result,
    });
});

// DELETE /api/v1/users/:id   (superAdmin only)
const deleteUser = catchAsync(async (req, res) => {
    const result = await userServices.deleteUser(req.params.id, req.user._id);
    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User deleted successfully',
        data: result,
    });
});

// ── PROFILE CONTROLLERS ───────────────────────────────────────────────────────

// GET /api/v1/users/me
const getMyProfile = catchAsync(async (req, res) => {
    // console.log(req.user)
    const result = await userServices.getMyProfile(req.user._id);
    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile retrieved successfully',
        data: result,
    });
});

// PATCH /api/v1/users/me
const updateProfile = catchAsync(async (req, res) => {
    const result = await userServices.updateProfile(req.user._id, req.body);
    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile updated successfully',
        data: result,
    });
});

// POST /api/v1/users/me/change-password
const changePassword = catchAsync(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const result = await userServices.changePassword(req.user._id, oldPassword, newPassword);
    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

export const userControllers = {
    // Address management (user)
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    // Profile (all roles)
    getMyProfile,
    updateProfile,
    changePassword,
    // User management (superAdmin)
    getAllUsers,
    updateUserRole,
    toggleBlockUser,
    deleteUser,
};

