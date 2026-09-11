import httpStatus from 'http-status';
import { User } from '../auth/model.auth';
import { TSavedAddress } from '../auth/interface.auth';
import AppError from '../../errors/AppErrors';

const MAX_SAVED_ADDRESSES = 5;

// ── Get all saved addresses ────────────────────────────────────────────────────
const getAddresses = async (userId: string) => {
    const user = await User.findById(userId).select('savedAddresses');
    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found', 'User not found');
    return user.savedAddresses ?? [];
};

// ── Auto-save address after order placement ───────────────────────────────────
// Called internally from the order service.  Does NOT throw — failures are silent
// so they never block an already-successful order.
const autoSaveAddressFromOrder = async (
    userId: string,
    incoming: TSavedAddress,
) => {
    try {
        const user = await User.findById(userId).select('savedAddresses');
        if (!user) return;

        const existing = user.savedAddresses ?? [];

        // Check for exact duplicate (same address + phone) — don't save twice
        const isDuplicate = existing.some(
            (a) => a.address === incoming.address && a.phone === incoming.phone,
        );
        if (isDuplicate) return;

        // If limit reached, drop the oldest non-default entry
        if (existing.length >= MAX_SAVED_ADDRESSES) {
            const oldestIndex = existing.findIndex((a) => !a.isDefault);
            if (oldestIndex !== -1) {
                existing.splice(oldestIndex, 1);
            } else {
                return; // all are default — respect user's choices
            }
        }

        // First address? Make it default automatically
        const makeDefault = existing.length === 0;

        await User.findByIdAndUpdate(userId, {
            $push: {
                savedAddresses: { ...incoming, isDefault: makeDefault },
            },
        });
    } catch {
        // silent — do not break the order flow
    }
};

// ── Add address manually ───────────────────────────────────────────────────────
const addAddress = async (userId: string, data: TSavedAddress) => {
    const user = await User.findById(userId).select('savedAddresses');
    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found', 'User not found');

    const existing = user.savedAddresses ?? [];

    if (existing.length >= MAX_SAVED_ADDRESSES) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Maximum ${MAX_SAVED_ADDRESSES} addresses allowed`,
            'Address limit reached',
        );
    }

    // If this is set as default, clear others first
    if (data.isDefault) {
        await User.updateOne(
            { _id: userId },
            { $set: { 'savedAddresses.$[].isDefault': false } },
        );
    }

    // Auto-default if it's the first address
    const isDefault = existing.length === 0 ? true : (data.isDefault ?? false);

    const updated = await User.findByIdAndUpdate(
        userId,
        { $push: { savedAddresses: { ...data, isDefault } } },
        { new: true, select: 'savedAddresses' },
    );

    return updated?.savedAddresses;
};

// ── Update a specific address ──────────────────────────────────────────────────
const updateAddress = async (
    userId: string,
    addressId: string,
    data: Partial<TSavedAddress>,
) => {
    // If marking as default, unset all others first
    if (data.isDefault) {
        await User.updateOne(
            { _id: userId },
            { $set: { 'savedAddresses.$[].isDefault': false } },
        );
    }

    const result = await User.findOneAndUpdate(
        { _id: userId, 'savedAddresses._id': addressId },
        {
            $set: Object.fromEntries(
                Object.entries(data).map(([k, v]) => [`savedAddresses.$.${k}`, v]),
            ),
        },
        { new: true, select: 'savedAddresses' },
    );

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Address not found', 'Address not found');
    }

    return result.savedAddresses;
};

// ── Delete a specific address ──────────────────────────────────────────────────
const deleteAddress = async (userId: string, addressId: string) => {
    const result = await User.findByIdAndUpdate(
        userId,
        { $pull: { savedAddresses: { _id: addressId } } },
        { new: true, select: 'savedAddresses' },
    );

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found', 'User not found');
    }

    return result.savedAddresses;
};

// ── Set default address ────────────────────────────────────────────────────────
const setDefaultAddress = async (userId: string, addressId: string) => {
    // Unset all
    await User.updateOne(
        { _id: userId },
        { $set: { 'savedAddresses.$[].isDefault': false } },
    );
    // Set the chosen one
    const result = await User.findOneAndUpdate(
        { _id: userId, 'savedAddresses._id': addressId },
        { $set: { 'savedAddresses.$.isDefault': true } },
        { new: true, select: 'savedAddresses' },
    );

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Address not found', 'Address not found');
    }

    return result.savedAddresses;
};

// ── SUPERADMIN: Get all users (with search & pagination) ──────────────────────
const getAllUsers = async (query: {
    search?: string;
    role?: string;
    isBlocked?: string | boolean;
    page?: number;
    limit?: number;
}) => {
    const { search, role, page = 1, limit = 20 } = query;
    const filter: Record<string, unknown> = {};

    if (search) {
        filter.$or = [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { contactNumber: { $regex: search, $options: 'i' } },
        ];
    }
    if (role) filter.role = role;
    if (query.isBlocked !== undefined) {
        filter.isBlocked = query.isBlocked === 'true' || query.isBlocked === true;
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
        .select('-password -savedAddresses')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

// ── SUPERADMIN: Update a user's role ─────────────────────────────────────────
const updateUserRole = async (
    targetId: string,
    callerId: string,
    newRole: 'user' | 'admin' | 'superAdmin',
) => {
    if (targetId === callerId) {
        throw new AppError(httpStatus.FORBIDDEN, 'Cannot change your own role', 'Self-operation not allowed');
    }

    const user = await User.findByIdAndUpdate(
        targetId,
        { role: newRole },
        { new: true, select: '-password -savedAddresses' },
    );

    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found', 'User not found');
    return user;
};

// ── SUPERADMIN: Toggle block/unblock a user ───────────────────────────────────
const toggleBlockUser = async (targetId: string, callerId: string) => {
    if (targetId === callerId) {
        throw new AppError(httpStatus.FORBIDDEN, 'Cannot block yourself', 'Self-operation not allowed');
    }

    const user = await User.findById(targetId).select('isBlocked');
    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found', 'User not found');

    const updated = await User.findByIdAndUpdate(
        targetId,
        { isBlocked: !user.isBlocked },
        { new: true, select: '-password -savedAddresses' },
    );

    return updated;
};

// ── SUPERADMIN: Delete a user ─────────────────────────────────────────────────
const deleteUser = async (targetId: string, callerId: string) => {
    if (targetId === callerId) {
        throw new AppError(httpStatus.FORBIDDEN, 'Cannot delete yourself', 'Self-operation not allowed');
    }

    const user = await User.findByIdAndDelete(targetId);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found', 'User not found');
    return { deleted: true, userId: targetId };
};


// ── PROFILE: Get own profile ─────────────────────────────────────────────────
const getMyProfile = async (userId: string) => {
    const user = await User.findById(userId).select('-password -savedAddresses').lean();
    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found', 'User not found');
    return user;
};

// ── PROFILE: Update own profile fields ───────────────────────────────────────
const updateProfile = async (
    userId: string,
    data: {
        username?: string;
        contactNumber?: string;
        address?: string;
        profilePicture?: string;
    },
) => {
    // If changing username, ensure it's not already taken by another user
    if (data.username) {
        const existing = await User.findOne({ username: data.username, _id: { $ne: userId } });
        if (existing) {
            throw new AppError(httpStatus.CONFLICT, 'Username already taken', 'Username conflict');
        }
    }

    const updated = await User.findByIdAndUpdate(
        userId,
        { $set: data },
        { new: true, select: '-password -savedAddresses' },
    );

    if (!updated) throw new AppError(httpStatus.NOT_FOUND, 'User not found', 'User not found');
    return updated;
};

// ── PROFILE: Change password ──────────────────────────────────────────────────
const changePassword = async (
    userId: string,
    oldPassword: string,
    newPassword: string,
) => {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found', 'User not found');

    // Verify old password
    const matched = await (User as any).isPasswordMatched(oldPassword, user.password);
    if (!matched) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Current password is incorrect', 'Wrong password');
    }

    if (oldPassword === newPassword) {
        throw new AppError(httpStatus.BAD_REQUEST, 'New password must differ from the current one', 'Same password');
    }

    const bcrypt = await import('bcrypt');
    const hashed = await bcrypt.hash(newPassword, 12);

    await User.findByIdAndUpdate(userId, {
        password: hashed,
        passwordChangedAt: new Date(),
    });

    return { success: true, message: 'Password changed successfully' };
};


export const userServices = {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    autoSaveAddressFromOrder,

    // ── Profile ───────────────────────────────────────────────────────
    getMyProfile,
    updateProfile,
    changePassword,

    // ── Superadmin ────────────────────────────────────────────────────
    getAllUsers,
    updateUserRole,
    toggleBlockUser,
    deleteUser,
};

