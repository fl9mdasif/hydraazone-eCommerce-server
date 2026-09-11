import { Document, Model, Types } from 'mongoose';

export interface TCartItem {
    product: Types.ObjectId;
    variantId: Types.ObjectId;
    quantity: number;
}

export interface TCart {
    user: Types.ObjectId;
    items: TCartItem[];
}

export interface TCartDocument extends TCart, Document {
    createdAt: Date;
    updatedAt: Date;
}

export interface TCartModel extends Model<TCartDocument> { }
