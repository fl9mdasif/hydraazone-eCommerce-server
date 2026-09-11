import { Document, Model } from 'mongoose';

// Single-document config store for marketing IDs + shipping/dashboard tuning.
// There is only ever one Settings document in the collection.
export interface TSettings {
    fbPixelId?: string;
    gaId?: string;
    gtmId?: string;
    searchConsoleTag?: string;
    fbConversionApiToken?: string;
    whatsappNumber?: string;
    messengerPageId?: string;

    // Shipping — flat rate override. Falls back to the SHIPPING_CHARGE /
    // FREE_SHIPPING_THRESHOLD constants in order/const.order.ts when unset,
    // so orders keep working even before an admin ever touches /settings.
    shippingRate?: number;
    freeShippingThreshold?: number;

    // Admin dashboard — a variant at or below this stock count is "low stock".
    lowStockThreshold?: number;
}

export interface TSettingsDocument extends TSettings, Document { }
export interface TSettingsModel extends Model<TSettingsDocument> { }
