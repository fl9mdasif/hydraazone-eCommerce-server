import { Schema, model } from 'mongoose';
import { TCartDocument, TCartModel } from './interface.cart';

const cartItemSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        variantId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { _id: false },
);

const cartSchema = new Schema<TCartDocument, TCartModel>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        items: [cartItemSchema],
    },
    {
        timestamps: true,
    },
);

export const Cart = model<TCartDocument, TCartModel>('Cart', cartSchema);
