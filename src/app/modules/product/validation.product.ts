import { z } from 'zod';

// ── Variant ─────────────────────────────────────────────────────────────────
const variantSchema = z.object({
    name: z.string({ message: 'Variant name is required' }).trim().min(1),
    sku: z.string({ message: 'SKU is required' }).trim().min(1),
    price: z.number({ message: 'Price is required' }).positive(),
    discountPrice: z.number().positive().nullable().optional(),
    stock: z.number().int().min(0).default(0),
    weight: z.number().positive().optional(),
    images: z.array(z.string().url()).optional().default([]),
    isAvailable: z.boolean().optional().default(true),
    attributes: z.record(z.string(), z.string()).optional(),
});

const updateVariantSchema = variantSchema.partial().extend({
    // SKU must remain present so we know which variant to update (if patching individually)
});

const updateVariantValidationSchema = z.object({
    body: z.object({
        price: z.number().positive().optional(),
        discountPrice: z.number().positive().nullable().optional(),
        stock: z.number().int().min(0).optional(),
        weight: z.number().positive().optional(),
        images: z.array(z.string().url()).optional(),
        isAvailable: z.boolean().optional(),
        attributes: z.record(z.string(), z.string()).optional(),
    }).refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided to update',
    }),
});

// ── Product ──────────────────────────────────────────────────────────────────
const createProductValidationSchema = z.object({
    body: z.object({
        name: z.string({ message: 'Product name is required' }).trim().min(1),
        slug: z
            .string({ message: 'Slug is required' })
            .trim()
            .min(1)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
                message: 'Slug must be lowercase letters, numbers, and hyphens only',
            }),
        description: z.string({ message: 'Description is required' }).min(1),
        category: z.string({ message: 'Category ID is required' }),
        tags: z.array(z.string()).optional().default([]),
        thumbnail: z
            .string({ message: 'Thumbnail URL is required' })
            .url({ message: 'Thumbnail must be a valid URL' }),
        gallery: z.array(z.string().url()).optional().default([]),
        variants: z
            .array(variantSchema)
            .min(1, { message: 'At least one variant is required' }),
        status: z.enum(['active', 'draft', 'archived']).optional().default('draft'),
        isFeatured: z.boolean().optional().default(false),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
    }),
});

const updateProductValidationSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1).optional(),
        slug: z
            .string()
            .trim()
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
                message: 'Slug must be lowercase letters, numbers, and hyphens only',
            })
            .optional(),
        description: z.string().min(1).optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        thumbnail: z.string().url().optional(),
        gallery: z.array(z.string().url()).optional(),
        variants: z.array(updateVariantSchema).min(1).optional(),
        status: z.enum(['active', 'draft', 'archived']).optional(),
        isFeatured: z.boolean().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
    }),
});

export const productValidations = {
    createProductValidationSchema,
    updateProductValidationSchema,
    updateVariantValidationSchema,
};