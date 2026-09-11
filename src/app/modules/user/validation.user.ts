import { z } from 'zod';

const addressBaseSchema = z.object({
    label: z.string().optional(),
    fullName: z.string({ message: 'Full name is required' }).min(1),
    phone: z.string({ message: 'Phone is required' }).min(1),
    address: z.string({ message: 'Address is required' }).min(1),
    city: z.string({ message: 'City is required' }).min(1),
    district: z.string({ message: 'District is required' }).min(1),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    isDefault: z.boolean().optional(),
});

// POST /users/addresses
const addAddressValidation = z.object({
    body: addressBaseSchema,
});

// PATCH /users/addresses/:id
const updateAddressValidation = z.object({
    body: addressBaseSchema.partial(),   // every field optional on update
});

export const userValidations = {
    addAddressValidation,
    updateAddressValidation,
};
