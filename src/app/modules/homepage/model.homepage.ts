import { Schema, model } from 'mongoose';
import { THomepageDocument, THomepageModel } from './interface.homepage';

const linkRefSchema = new Schema(
    {
        href: { type: String, required: true },
        label: { type: String, required: true },
    },
    { _id: false },
);

// `headingColor`/`bodyColor`: hex strings from the admin's 10-swatch
// palette; unset (undefined) means "use the section's own default colour".
const colorFields = {
    headingColor: { type: String },
    bodyColor: { type: String },
};

const heroSlideSchema = new Schema(
    {
        id: { type: String, required: true },
        eyebrow: { type: String, required: true },
        headline: { type: String, required: true },
        body: { type: String, required: true },
        primary: { type: linkRefSchema, required: true },
        secondary: { type: linkRefSchema },
        image: { type: String, required: true },
        imageAlt: { type: String, required: true },
        ...colorFields,
    },
    { _id: false },
);

const promoTileSchema = new Schema(
    {
        id: { type: String, required: true },
        title: { type: String, required: true },
        body: { type: String, required: true },
        href: { type: String, required: true },
        cta: { type: String, required: true },
        image: { type: String, required: true },
        imageAlt: { type: String, required: true },
        ...colorFields,
    },
    { _id: false },
);

const offerTileSchema = new Schema(
    {
        eyebrow: { type: String, required: true },
        title: { type: String, required: true },
        body: { type: String, required: true },
        href: { type: String, required: true },
        cta: { type: String, required: true },
        ...colorFields,
    },
    { _id: false },
);

const collectionTileSchema = new Schema(
    {
        id: { type: String, required: true },
        title: { type: String, required: true },
        body: { type: String, required: true },
        href: { type: String, required: true },
        cta: { type: String, required: true },
        image: { type: String, required: true },
        imageAlt: { type: String, required: true },
        ...colorFields,
    },
    { _id: false },
);

// Defaults mirror `client/src/content/home.ts` at the moment this module was
// added, so the first lazy-created document renders identically to what the
// homepage looked like when it was still hardcoded — no seed script, no
// blank-homepage moment on a fresh database.
const homepageSchema = new Schema<THomepageDocument, THomepageModel>(
    {
        heroSlides: {
            type: [heroSlideSchema],
            default: [
                {
                    id: 'live-beautifully',
                    eyebrow: 'New collection',
                    headline: 'Live Beautifully.\nEvery Day.',
                    body: 'Curated products for a better lifestyle. Quality, comfort and elegance — all in one place.',
                    primary: { href: '/shop', label: 'Shop now' },
                    secondary: { href: '/category/home-living', label: 'Explore collection' },
                    image:
                        'https://www.morty.com/resources/wp-content/uploads/2020/02/spacejoy-YI2YkyaREHk-unsplash-scaled-e1695671185895.webp',
                    imageAlt: 'A styled living room corner with a ceramic vase and soft throw',
                },
                {
                    id: 'made-for-real-life',
                    eyebrow: 'Home & living',
                    headline: 'Made for\nReal Life.',
                    body: 'Hard-wearing pieces that look better with use. Chosen to last, priced to be used.',
                    primary: { href: '/category/home-living', label: 'Shop home' },
                    secondary: { href: '/shop', label: 'Browse everything' },
                    image: 'https://www.theatrium.com.mt/content/images/home/homedecorimages/hero-refresh.jpg',
                    imageAlt: 'A refreshed, sunlit home interior styled with warm decor',
                },
                {
                    id: 'small-upgrades',
                    eyebrow: 'Beauty & care',
                    headline: 'Small Upgrades.\nBig Difference.',
                    body: 'Clean formulations and honest labels, from daily skincare to the details that finish a routine.',
                    primary: { href: '/category/beauty-care', label: 'Shop beauty' },
                    secondary: { href: '/category/health-wellness', label: 'Wellness' },
                    image:
                        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYpX2jkuAByFTErLLvxPdKAAcBaB5gYxPwV-bGz3UcuA&s=10',
                    imageAlt: 'A softly lit lifestyle product arrangement',
                },
            ],
        },

        promoTiles: {
            type: [promoTileSchema],
            default: [
                {
                    id: 'new-arrivals',
                    title: 'New Arrivals',
                    body: 'The latest pieces to land, fresh off the shelf.',
                    href: '/shop?sort=-createdAt',
                    cta: 'Shop now',
                    image: 'https://picsum.photos/seed/hz-promo-new/600/700',
                    imageAlt: 'A leather handbag photographed against a warm neutral backdrop',
                },
                {
                    id: 'trending',
                    title: 'Trending Now',
                    body: 'What everyone has been reaching for this month.',
                    href: '/shop?sort=-rating',
                    cta: 'Shop now',
                    image: 'https://picsum.photos/seed/hz-promo-trending/600/700',
                    imageAlt: 'A pair of over-ear headphones on a textured surface',
                },
                {
                    id: 'best-sellers',
                    title: 'Best Sellers',
                    body: 'Customer favourites, rated and reviewed.',
                    href: '/shop?sort=-rating',
                    cta: 'Shop now',
                    image: 'https://picsum.photos/seed/hz-promo-best/600/700',
                    imageAlt: 'A glass fragrance bottle catching soft daylight',
                },
            ],
        },

        offerTile: {
            type: offerTileSchema,
            default: {
                eyebrow: 'Limited time',
                title: 'Up to 40% Off',
                body: 'On selected items across home, beauty and kitchen.',
                href: '/shop',
                cta: 'Shop the sale',
            },
        },

        collections: {
            type: [collectionTileSchema],
            default: [
                {
                    id: 'effortless-essentials',
                    title: 'Effortless Essentials',
                    body: 'Light, breathable and made for everyday use.',
                    href: '/category/home-living',
                    cta: 'Shop now',
                    image: 'https://picsum.photos/seed/hz-col-essentials/1000/800',
                    imageAlt: 'A low table with a vase and stacked linen in warm daylight',
                },
                {
                    id: 'home-living',
                    title: 'Home & Living',
                    body: 'Designed for the way you live.',
                    href: '/category/home-living',
                    cta: 'Shop now',
                    image: 'https://picsum.photos/seed/hz-col-home/700/400',
                    imageAlt: 'Two stoneware vases on a pale shelf',
                },
                {
                    id: 'beauty-care',
                    title: 'Beauty & Care',
                    body: 'Clean, conscious, crafted for you.',
                    href: '/category/beauty-care',
                    cta: 'Shop now',
                    image: 'https://picsum.photos/seed/hz-col-beauty/700/400',
                    imageAlt: 'Skincare bottles beside a folded towel',
                },
            ],
        },
    },
    { timestamps: true },
);

export const Homepage = model<THomepageDocument, THomepageModel>('Homepage', homepageSchema);
