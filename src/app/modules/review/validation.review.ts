import { z } from 'zod';

const createReviewValidationSchema = z.object({
    body: z.object({
        productId: z.string({ message: 'Product ID is required' }),
        orderId: z.string({ message: 'Order ID is required' }),
        variantId: z.string({ message: 'Variant ID is required' }),
        rating: z.number({ message: 'Rating is required' }).int().min(1).max(5),
        comment: z.string().trim().max(2000).optional(),
        photos: z.array(z.string().url()).max(6).optional(),
    }),
});

const updateReviewStatusValidationSchema = z.object({
    body: z.object({
        status: z.enum(['pending', 'approved', 'rejected'], {
            message: 'Invalid review status',
        }),
    }),
});

export const reviewValidations = {
    createReviewValidationSchema,
    updateReviewStatusValidationSchema,
};
