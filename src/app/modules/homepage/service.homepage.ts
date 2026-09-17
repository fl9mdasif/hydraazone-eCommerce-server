import { Homepage } from './model.homepage';
import { THomepage } from './interface.homepage';

// Singleton collection — there is only ever one Homepage document, matched
// with an empty filter so we never need to know/track its _id. Same pattern
// as Settings.
const SINGLETON_FILTER = {};

// Public — everything here is meant to be rendered on the storefront, so
// unlike Settings there is no secret field to filter out before returning.
const getHomepage = async () => {
    let homepage = await Homepage.findOne(SINGLETON_FILTER);
    if (!homepage) {
        homepage = await Homepage.create({});
    }
    return homepage;
};

// Admin-only update — merges the given fields into the singleton document.
// Each top-level field (heroSlides / promoTiles / offerTile / collections)
// is always sent as a whole replacement array/object by the client, never a
// partial array-element patch.
const updateHomepage = async (payload: Partial<THomepage>) => {
    const homepage = await Homepage.findOneAndUpdate(
        SINGLETON_FILTER,
        { $set: payload },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );
    return homepage;
};

export const homepageServices = {
    getHomepage,
    updateHomepage,
};
