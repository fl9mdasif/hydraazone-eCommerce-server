import { Settings } from './model.settings';
import { TSettings } from './interface.settings';

// Singleton collection — there is only ever one Settings document, matched
// with an empty filter so we never need to know/track its _id.
const SINGLETON_FILTER = {};

// Reads the full settings document (including secrets like
// fbConversionApiToken), creating an empty default one on first call.
// Only for internal/server-side use — never return this straight from a
// public route.
const getSettings = async () => {
    let settings = await Settings.findOne(SINGLETON_FILTER);
    if (!settings) {
        settings = await Settings.create({});
    }
    return settings;
};

// Frontend-safe projection of settings — excludes fbConversionApiToken
// (a server-side secret used only for the Meta Conversions API call) and
// lowStockThreshold (an internal admin-dashboard tuning value).
const getPublicSettings = async () => {
    const settings = await getSettings();
    const {
        fbPixelId,
        gaId,
        gtmId,
        searchConsoleTag,
        whatsappNumber,
        messengerPageId,
        shippingRate,
        freeShippingThreshold,
    } = settings;

    return {
        fbPixelId,
        gaId,
        gtmId,
        searchConsoleTag,
        whatsappNumber,
        messengerPageId,
        shippingRate,
        freeShippingThreshold,
    };
};

// Admin-only update — merges the given fields into the singleton document.
const updateSettings = async (payload: Partial<TSettings>) => {
    const settings = await Settings.findOneAndUpdate(
        SINGLETON_FILTER,
        { $set: payload },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );
    return settings;
};

export const settingsServices = {
    getSettings,
    getPublicSettings,
    updateSettings,
};
