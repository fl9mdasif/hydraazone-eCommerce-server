import { Document, Model } from 'mongoose';

export interface TCategory {
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface TCategoryDocument extends TCategory, Document { }

export interface TCategoryModel extends Model<TCategoryDocument> { }