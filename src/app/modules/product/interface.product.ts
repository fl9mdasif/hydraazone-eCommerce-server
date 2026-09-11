import { Document, Model, Types } from 'mongoose';

export interface TVariant {
    name: string;                            // "500ml", "1L"
    sku: string;                             // "MUSTARD-OIL-500ML"
    price: number;
    discountPrice?: number;
    stock: number;
    weight?: number;                         // grams
    images?: string[];
    isAvailable?: boolean;
    attributes?: Map<string, string>;        // { color: "yellow", size: "500ml" }
}

export type TProductStatus = 'active' | 'draft' | 'archived';

export interface TProduct {
    name: string;
    slug: string;
    description: string;
    category: Types.ObjectId;
    tags?: string[];
    thumbnail: string;
    gallery?: string[];
    variants: TVariant[];
    rating?: number;
    reviewCount?: number;
    status?: TProductStatus;
    isFeatured?: boolean;
    metaTitle?: string;
    metaDescription?: string;
}

export interface TProductDocument extends TProduct, Document { }

export interface TProductModel extends Model<TProductDocument> { }