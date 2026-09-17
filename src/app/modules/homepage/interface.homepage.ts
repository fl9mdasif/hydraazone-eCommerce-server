import { Document, Model } from 'mongoose';

// Single-document config store for the homepage's editorial content — the
// hero carousel, the 3-card "quick links" grid plus its dark offer card,
// and the "Featured Collections" grid. There is only ever one Homepage
// document in the collection (same singleton pattern as Settings).
//
// Everything else on the homepage (trust strip, quality banner, feature
// strip, nav) stays static in the client's content/home.ts — out of scope.

export interface TLinkRef {
    href: string;
    label: string;
}

// `headingColor`/`bodyColor` are hex strings picked from a fixed 10-swatch
// palette in the admin UI — unset means "use the section's own default
// text colour" (e.g. white text over the promo tile's photo scrim).
export interface THeroSlide {
    id: string;
    eyebrow: string;
    headline: string;
    body: string;
    primary: TLinkRef;
    secondary?: TLinkRef;
    image: string;
    imageAlt: string;
    headingColor?: string;
    bodyColor?: string;
}

export interface TPromoTile {
    id: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    image: string;
    imageAlt: string;
    headingColor?: string;
    bodyColor?: string;
}

export interface TOfferTile {
    eyebrow: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    headingColor?: string;
    bodyColor?: string;
}

export interface TCollectionTile {
    id: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    image: string;
    imageAlt: string;
    headingColor?: string;
    bodyColor?: string;
}

export interface THomepage {
    heroSlides: THeroSlide[];
    promoTiles: TPromoTile[];
    offerTile: TOfferTile;
    collections: TCollectionTile[];
}

export interface THomepageDocument extends THomepage, Document { }
export interface THomepageModel extends Model<THomepageDocument> { }
