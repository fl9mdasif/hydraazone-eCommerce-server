import { z } from 'zod';

const addToCartValidationSchema = z.object({
    body: z.object({
        productId: z.string({
            message: 'Product ID is required',
        }),
        variantId: z.string({
            message: 'Variant ID is required',
        }),
        quantity: z.number({
            message: 'Quantity is required',
        }).min(1, 'Quantity must be at least 1'),
    }),
});

const updateCartItemValidationSchema = z.object({
    body: z.object({
        quantity: z.number({
            message: 'Quantity is required',
        }).min(1, 'Quantity must be at least 1'),
    }),
});

export const cartValidations = {
    addToCartValidationSchema,
    updateCartItemValidationSchema,
};
