import { z } from 'zod';

const linkRefSchema = z.object({
    href: z.string().min(1),
    label: z.string().min(1),
});

// Hex strings from the admin's 10-swatch palette — unset means "use the
// section's own default colour".
const colorFields = {
    headingColor: z.string().optional(),
    bodyColor: z.string().optional(),
};

const heroSlideSchema = z.object({
    id: z.string().min(1),
    eyebrow: z.string().min(1),
    headline: z.string().min(1),
    body: z.string().min(1),
    primary: linkRefSchema,
    secondary: linkRefSchema.optional(),
    image: z.string().min(1),
    imageAlt: z.string().min(1),
    ...colorFields,
});

const promoTileSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    href: z.string().min(1),
    cta: z.string().min(1),
    image: z.string().min(1),
    imageAlt: z.string().min(1),
    ...colorFields,
});

const offerTileSchema = z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    href: z.string().min(1),
    cta: z.string().min(1),
    ...colorFields,
});

const collectionTileSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    href: z.string().min(1),
    cta: z.string().min(1),
    image: z.string().min(1),
    imageAlt: z.string().min(1),
    ...colorFields,
});

// Every top-level field is optional (a PATCH sends whichever section
// changed), but each array item's own fields are required — a full
// replacement array is always sent, never a partial array-element patch.
const updateHomepageValidationSchema = z.object({
    body: z.object({
        heroSlides: z.array(heroSlideSchema).optional(),
        promoTiles: z.array(promoTileSchema).optional(),
        offerTile: offerTileSchema.optional(),
        collections: z.array(collectionTileSchema).optional(),
    }),
});

export const homepageValidations = {
    updateHomepageValidationSchema,
};
