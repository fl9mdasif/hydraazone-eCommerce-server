import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { response } from '../../utils/sendResponse';
import { settingsServices } from './service.settings';

// GET /api/v1/settings — public, the frontend needs these to render pixels/buttons.
// Returns a safe projection only — secrets like fbConversionApiToken never leave the server.
const getSettings = catchAsync(async (req, res) => {
    const result = await settingsServices.getPublicSettings();

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Settings retrieved successfully',
        data: result,
    });
});

// PATCH /api/v1/settings — admin / superAdmin only
const updateSettings = catchAsync(async (req, res) => {
    const result = await settingsServices.updateSettings(req.body);

    response.createSendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Settings updated successfully',
        data: result,
    });
});

export const settingsControllers = {
    getSettings,
    updateSettings,
};
