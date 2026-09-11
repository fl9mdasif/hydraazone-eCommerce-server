import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';
import { productServices } from './service.product';

// Create product
const createProduct = catchAsync(async (req, res) => {
    const result = await productServices.createProduct(req.body);

    response.createSendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Product created successfully',
        data: result,
    });
});

// Get all products (with filters & pagination)
const getAllProducts = catchAsync(async (req, res) => {
    const result = await productServices.getAllProducts(req.query);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Products retrieved successfully',
        data: result,
    });
});

// Get single product by ObjectId or slug
const getSingleProduct = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const result = await productServices.getSingleProduct(productId);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Product retrieved successfully',
        data: result,
    });
});

// Update product
const updateProduct = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const result = await productServices.updateProduct(productId, req.body);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Product updated successfully',
        data: result,
    });
});

// Delete product
const deleteProduct = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const result = await productServices.deleteProduct(productId);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Product deleted successfully',
        data: result,
    });
});

// Toggle isFeatured flag
const toggleFeatured = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const result = await productServices.toggleFeatured(productId);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Product is now ${result.isFeatured ? 'featured' : 'unfeatured'}`,
        data: result,
    });
});

// Update a specific variant
const updateVariant = catchAsync(async (req, res) => {
    const { productId, variantId } = req.params;

    const result = await productServices.updateVariant(
        productId,
        variantId,
        req.body,
    );

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Variant updated successfully',
        data: result,
    });
});

// NOTE: reviews are now handled by the dedicated `review` module
// (POST /api/v1/reviews) — see review/service.review.ts for why the old
// unguarded addReviewRating endpoint was removed from here.

export const productControllers = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    toggleFeatured,
    updateVariant,
};
