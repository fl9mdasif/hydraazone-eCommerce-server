import { Document, Model, Types } from 'mongoose';

export type TReviewStatus = 'pending' | 'approved' | 'rejected';

export interface TReview {
    user: Types.ObjectId;
    product: Types.ObjectId;
    order: Types.ObjectId;
    variantId: Types.ObjectId;
    rating: number;
    comment?: string;
    photos?: string[];
    status: TReviewStatus;
}

export interface TReviewDocument extends TReview, Document {
    createdAt: Date;
    updatedAt: Date;
}

export interface TReviewModel extends Model<TReviewDocument> { }
