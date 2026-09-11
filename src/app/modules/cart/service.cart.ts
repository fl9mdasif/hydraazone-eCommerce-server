import httpStatus from 'http-status';
import { Product } from '../product/model.product';
import { Cart } from './model.cart';
import { Types } from 'mongoose';
import AppError from '../../errors/AppErrors';

const addToCart = async (userId: string, payload: { productId: string; variantId: string; quantity: number }) => {
    const { productId, variantId, quantity } = payload;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }

    // Check if variant exists in the product
    const variant = product.variants.find((v: any) => v._id?.toString() === variantId || v.sku === variantId);
    // Note: Using find might depend on whether variantId is an actual ObjectId or a string SKU.
    // Given the interface, it's likely an ObjectId.

    if (!variant) {
        throw new AppError(httpStatus.NOT_FOUND, 'Product variant not found');
    }

    // Find user's cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
        // Create new cart
        cart = await Cart.create({
            user: userId,
            items: [{ product: productId, variantId, quantity }],
        });
    } else {
        // Check if item already exists in cart
        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId && item.variantId.toString() === variantId
        );

        if (itemIndex > -1) {
            // Update quantity
            cart.items[itemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({ product: new Types.ObjectId(productId), variantId: new Types.ObjectId(variantId), quantity });
        }
        await cart.save();
    }

    return cart;
};

const getCart = async (userId: string) => {
    const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.product',
        select: 'name thumbnail variants slug',
    });
    return cart;
};

const updateCartItemQuantity = async (userId: string, productId: string, variantId: string, quantity: number) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
    }

    const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId && item.variantId.toString() === variantId
    );

    if (itemIndex === -1) {
        throw new AppError(httpStatus.NOT_FOUND, 'Item not found in cart');
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return cart;
};

const removeFromCart = async (userId: string, productId: string, variantId: string) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
    }

    cart.items = cart.items.filter(
        (item) => !(item.product.toString() === productId && item.variantId.toString() === variantId)
    );

    await cart.save();
    return cart;
};

const clearCart = async (userId: string) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
    }

    cart.items = [];
    await cart.save();
    return cart;
};

export const cartServices = {
    addToCart,
    getCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
};
