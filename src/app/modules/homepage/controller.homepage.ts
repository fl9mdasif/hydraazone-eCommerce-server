import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';
import { homepageServices } from './service.homepage';

// GET /api/v1/homepage — public, the storefront renders directly from this.
const getHomepage = catchAsync(async (req, res) => {
    const result = await homepageServices.getHomepage();

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Homepage content retrieved successfully',
        data: result,
    });
});

// PATCH /api/v1/homepage — admin / superAdmin only
const updateHomepage = catchAsync(async (req, res) => {
    const result = await homepageServices.updateHomepage(req.body);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Homepage content updated successfully',
        data: result,
    });
});

export const homepageControllers = {
    getHomepage,
    updateHomepage,
};
