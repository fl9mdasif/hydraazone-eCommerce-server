import { z } from 'zod';

const updateSettingsValidationSchema = z.object({
    body: z.object({
        fbPixelId: z.string().optional(),
        gaId: z.string().optional(),
        gtmId: z.string().optional(),
        searchConsoleTag: z.string().optional(),
        fbConversionApiToken: z.string().optional(),
        whatsappNumber: z.string().optional(),
        messengerPageId: z.string().optional(),
        shippingRate: z.number().min(0).optional(),
        freeShippingThreshold: z.number().min(0).optional(),
        lowStockThreshold: z.number().int().min(0).optional(),
    }),
});

export const settingsValidations = {
    updateSettingsValidationSchema,
};
