import { Schema, model } from 'mongoose';
import { TSettingsDocument, TSettingsModel } from './interface.settings';

const settingsSchema = new Schema<TSettingsDocument, TSettingsModel>(
    {
        fbPixelId: { type: String },
        gaId: { type: String },
        gtmId: { type: String },
        searchConsoleTag: { type: String },
        fbConversionApiToken: { type: String },
        whatsappNumber: { type: String },
        messengerPageId: { type: String },

        shippingRate: { type: Number },
        freeShippingThreshold: { type: Number },

        lowStockThreshold: { type: Number, default: 5 },
    },
    { timestamps: true },
);

export const Settings = model<TSettingsDocument, TSettingsModel>('Settings', settingsSchema);
