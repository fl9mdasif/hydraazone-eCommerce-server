import { Document, Model, Types } from 'mongoose';

// ── Enums ─────────────────────────────────────────────────────────────────────
export type TPaymentMethod = 'cod' | 'bkash' | 'nagad' | 'card' | 'bank';
export type TPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type TOrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'returned';

// ── Sub-interfaces ─────────────────────────────────────────────────────────────
export interface TOrderVariantSnapshot {
    variantId: Types.ObjectId;
    name: string;
    sku: string;
    price: number;
    discountPrice?: number;
}

export interface TOrderItem {
    product: Types.ObjectId;
    variant: TOrderVariantSnapshot;
    quantity: number;
    totalPrice: number;
    isReviewed?: boolean;
}

export interface TShippingAddress {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    postalCode?: string;
    country?: string;
}

export interface TStatusHistoryEntry {
    status: TOrderStatus;
    note?: string;
    changedAt?: Date;
}

// ── Main Order Interface ───────────────────────────────────────────────────────
export interface TOrder {
    user: Types.ObjectId;
    orderNumber: string;
    items: TOrderItem[];
    shippingAddress: TShippingAddress;
    paymentMethod: TPaymentMethod;
    paymentStatus?: TPaymentStatus;
    transactionId?: string;
    subtotal: number;
    shippingCharge?: number;
    discount?: number;
    totalAmount: number;
    orderStatus?: TOrderStatus;
    statusHistory: TStatusHistoryEntry[];
    deliveredAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    note?: string;
}

export interface TOrderDocument extends TOrder, Document { }
export interface TOrderModel extends Model<TOrderDocument> { }
