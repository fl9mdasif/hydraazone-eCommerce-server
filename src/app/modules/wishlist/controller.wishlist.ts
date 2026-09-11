import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';
import { wishlistServices } from './service.wishlist';

const getWishlist = catchAsync(async (req, res) => {
    const result = await wishlistServices.getWishlist(req.user._id);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Wishlist retrieved successfully',
        data: result,
    });
});

const addToWishlist = catchAsync(async (req, res) => {
    const result = await wishlistServices.addToWishlist(req.user._id, req.body.productId);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Product added to wishlist',
        data: result,
    });
});

const removeFromWishlist = catchAsync(async (req, res) => {
    const result = await wishlistServices.removeFromWishlist(req.user._id, req.params.productId);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Product removed from wishlist',
        data: result,
    });
});

export const wishlistControllers = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
};
