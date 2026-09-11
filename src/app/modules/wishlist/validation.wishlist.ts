import { z } from 'zod';

const addToWishlistValidationSchema = z.object({
    body: z.object({
        productId: z.string({ message: 'Product ID is required' }),
    }),
});

export const wishlistValidations = {
    addToWishlistValidationSchema,
};
