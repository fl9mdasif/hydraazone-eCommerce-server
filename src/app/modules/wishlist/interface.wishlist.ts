import { Document, Model, Types } from 'mongoose';

export interface TWishlistItem {
    product: Types.ObjectId;
    addedAt?: Date;
}

export interface TWishlist {
    user: Types.ObjectId;
    items: TWishlistItem[];
}

export interface TWishlistDocument extends TWishlist, Document {
    createdAt: Date;
    updatedAt: Date;
}

export interface TWishlistModel extends Model<TWishlistDocument> { }
