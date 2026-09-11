import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';
import { cartServices } from './service.cart';

const addToCart = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const result = await cartServices.addToCart(userId, req.body);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Product added to cart successfully',
        data: result,
    });
});

const getCart = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const result = await cartServices.getCart(userId);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Cart retrieved successfully',
        data: result,
    });
});

const updateCartItemQuantity = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { productId, variantId } = req.params;
    const { quantity } = req.body;

    const result = await cartServices.updateCartItemQuantity(userId, productId, variantId, quantity);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Cart item quantity updated successfully',
        data: result,
    });
});

const removeFromCart = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { productId, variantId } = req.params;

    const result = await cartServices.removeFromCart(userId, productId, variantId);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Product removed from cart successfully',
        data: result,
    });
});

const clearCart = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const result = await cartServices.clearCart(userId);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Cart cleared successfully',
        data: result,
    });
});

export const cartControllers = {
    addToCart,
    getCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
};
