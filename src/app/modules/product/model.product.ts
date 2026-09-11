import { Schema, model } from 'mongoose';

// Sub-schema for product variants (e.g., 250ml, 500ml, 1L)
const variantSchema = new Schema({
    name: { type: String, required: true },        // "500ml", "1L", "250ml"
    sku: { type: String, required: true, unique: true }, // "MUSTARD-OIL-500ML"
    price: { type: Number, required: true },
    discountPrice: { type: Number },               // sale price
    stock: { type: Number, required: true, default: 0 },
    weight: { type: Number },                      // in grams, useful for shipping
    images: [{ type: String }],                    // variant-specific images
    isAvailable: { type: Boolean, default: true },
    attributes: {                                  // flexible key-value for any extra specs
        type: Map,
        of: String,                                  // e.g., { "color": "yellow", "size": "500ml" }
    },
});

const productSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },         // "Mustard Oil"
        slug: { type: String, required: true, unique: true },       // "mustard-oil" (for SEO URLs)
        description: { type: String, required: true },                        // for product cards

        category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
        // brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
        tags: [{ type: String }],                                   // ["oil", "cooking", "organic"]

        // Main image + gallery
        thumbnail: { type: String, required: true },
        gallery: [{ type: String }],

        // Variants (the core of your requirement)
        variants: { type: [variantSchema], required: true },

        // Aggregated rating (updated via review logic)
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },

        status: {
            type: String,
            enum: ['active', 'draft', 'archived'],
            default: 'draft',
        },

        isFeatured: { type: Boolean, default: false },
        metaTitle: { type: String },                                // SEO
        metaDescription: { type: String },                         // SEO
    },
    { timestamps: true }
);

// Index for fast search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });

export const Product = model('Product', productSchema);