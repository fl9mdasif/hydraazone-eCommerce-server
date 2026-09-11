import httpStatus from 'http-status';
import { Types } from 'mongoose';
import AppError from '../../errors/AppErrors';
import { Product } from '../product/model.product';
import { Wishlist } from './model.wishlist';

// ── Get wishlist (populated) ────────────────────────────────────────────────────
const getWishlist = async (userId: string) => {
    const wishlist = await Wishlist.findOne({ user: userId }).populate({
        path: 'items.product',
        select: 'name slug thumbnail variants status',
    });
    return wishlist ?? { user: userId, items: [] };
};

// ── Add a product to the wishlist (idempotent) ──────────────────────────────────
const addToWishlist = async (userId: string, productId: string) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, 'Product not found', 'Product not found');
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
        wishlist = await Wishlist.create({
            user: userId,
            items: [{ product: productId }],
        });
        return wishlist;
    }

    const alreadyExists = wishlist.items.some(
        (item) => item.product.toString() === productId,
    );

    if (!alreadyExists) {
        wishlist.items.push({ product: new Types.ObjectId(productId), addedAt: new Date() });
        await wishlist.save();
    }

    return wishlist;
};

// ── Remove a product from the wishlist ──────────────────────────────────────────
const removeFromWishlist = async (userId: string, productId: string) => {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
        throw new AppError(httpStatus.NOT_FOUND, 'Wishlist not found', 'Wishlist not found');
    }

    wishlist.items = wishlist.items.filter(
        (item) => item.product.toString() !== productId,
    );

    await wishlist.save();
    return wishlist;
};

export const wishlistServices = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
};
