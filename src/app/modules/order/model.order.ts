import { Schema, model } from 'mongoose';

// Sub-schema for each item in the order
const orderItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: {
        variantId: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },       // "500ml"
        sku: { type: String, required: true },         // "MUSTARD-OIL-500ML"
        price: { type: Number, required: true },       // price AT time of order (important!)
        discountPrice: { type: Number },
    },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },   // variant.price * quantity
    isReviewed: { type: Boolean, default: false },
});

const shippingAddressSchema = new Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    postalCode: { type: String },
    country: { type: String, default: 'Bangladesh' },
});

const orderSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        orderNumber: { type: String, required: true, unique: true }, // "ORD-20240315-0001"

        items: { type: [orderItemSchema], required: true },

        shippingAddress: { type: shippingAddressSchema, required: true },

        // Payment
        paymentMethod: {
            type: String,
            enum: ['cod', 'bkash', 'nagad', 'card', 'bank'],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        transactionId: { type: String },               // from bkash/nagad/card gateway

        // Pricing breakdown
        subtotal: { type: Number, required: true },    // sum of all items
        shippingCharge: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },        // coupon discount
        totalAmount: { type: Number, required: true }, // subtotal + shipping - discount

        // Order lifecycle
        orderStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
            default: 'pending',
        },

        // Tracking
        statusHistory: [
            {
                status: { type: String, required: true },
                note: { type: String },                    // "Picked up by courier"
                changedAt: { type: Date, default: Date.now },
            },
        ],

        deliveredAt: { type: Date },
        cancelledAt: { type: Date },
        cancelReason: { type: String },

        note: { type: String },                        // customer note at checkout
    },
    { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 }); 
orderSchema.index({ orderStatus: 1 });

export const Order = model('Order', orderSchema);