import { Schema, model } from 'mongoose';
import { TWishlistDocument, TWishlistModel } from './interface.wishlist';

const wishlistItemSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        addedAt: { type: Date, default: Date.now },
    },
    { _id: false },
);

const wishlistSchema = new Schema<TWishlistDocument, TWishlistModel>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        items: [wishlistItemSchema],
    },
    { timestamps: true },
);

export const Wishlist = model<TWishlistDocument, TWishlistModel>('Wishlist', wishlistSchema);
