import { Schema, model } from 'mongoose';
import { TReviewDocument, TReviewModel } from './interface.review';

const reviewSchema = new Schema<TReviewDocument, TReviewModel>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        variantId: { type: Schema.Types.ObjectId, required: true },

        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, trim: true },
        photos: [{ type: String }],

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true },
);

// One review per order-item — prevents the same delivered item being reviewed twice.
reviewSchema.index({ order: 1, product: 1, variantId: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1 });

export const Review = model<TReviewDocument, TReviewModel>('Review', reviewSchema);
