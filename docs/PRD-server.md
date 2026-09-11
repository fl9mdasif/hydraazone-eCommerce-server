---
title: PRD - HydraaZone Server (built on the Sultan Bazar codebase)
client_budget: $85
stack: Node.js + Express + TypeScript + MongoDB (Mongoose) + Zod validation
codebase_audited: D:\LOCAL APID PROJECT\products\local_project\2026\e-commerce\hydraazone\server
---

# PRD: HydraaZone Server

## 1. Overview

HydraaZone needs a basic but complete e-commerce backend. Instead of building from zero, this PRD is written against the actual Sultan Bazar server code already sitting in the `hydraazone/server` directory, module by module, so the gap list below is real, not assumed. Payment is COD only for this build, no gateway integration needed even though the schema already supports bkash/nagad/card for later.

## 2. Existing code conventions (keep these, do not deviate)

- One folder per feature under `src/app/modules/<name>/`, files named `controller.<name>.ts`, `service.<name>.ts`, `model.<name>.ts`, `interface.<name>.ts`, `route.<name>.ts` (or `router.<name>.ts`, both exist in the current code, pick whichever the module already uses), `validation.<name>.ts`
- Mongoose schemas with `{ timestamps: true }`, sub-schemas inlined for nested objects (see `orderItemSchema`, `shippingAddressSchema`)
- Zod validation via `validateRequest` middleware, wired per-route
- Auth via `auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin)` middleware, roles are `user | admin | superAdmin`
- Controllers wrapped in `catchAsync`, responses via `sendResponse`, errors via `AppError` + `globalErrorHandler`
- New modules must follow this exact shape, a reviewer (or future-you) should not be able to tell which module is old Sultan Bazar and which is new HydraaZone work

## 3.1 Guest checkout (client decision, 2026-09-11)

Client requirement: a customer placing their **first order** must not be forced to sign up or log in first. Decided flow:

1. Checkout form collects the usual customer/shipping details (name, phone, address, district...) plus an **email** field (not currently part of `shippingAddress`, collected as a separate field on the checkout screen).
2. Frontend calls `POST /auth/guest-checkout` with `{ email, fullName, phone }`.
   - If no account exists for that email, one is silently created with password `123456` (`DEFAULT_USER_PASS` env var) and role `user`.
   - If an account already exists for that email, **do not auto-login** — respond asking the customer to log in with their password instead (see bug fix below). This closes the account-takeover hole where anyone could "guest checkout" as a known email with no password.
3. Response includes an access token (also set as an httpOnly cookie). Frontend immediately calls `POST /orders` with that token — same order flow as a logged-in user, no separate code path needed.
4. Customer can log in any time afterward with `email` + `123456`, then change their password from `/users/me/change-password`. No forced password-change flow is required for this build — communicate the default password to the customer via the order confirmation (email/SMS, frontend concern).

**Action item (Phase 1):** fix `guestCheckout` in `service.auth.ts` to stop issuing a token for an existing account without verifying a password — return a "please log in" style response instead (409/needs-login), so the auto-create-and-login path only ever fires for genuinely new customers.

## 3.2 Image hosting (client decision, 2026-09-11)

Sultan Bazar's production images are actually served from **imgbb**, not AWS — the S3 pre-signed-upload code in the `upload` module was written but never wired into the live client, so it's effectively unused/untested in production. Client will migrate to AWS S3 properly **before HydraaZone ships** (i.e., some time before go-live, not required for this development pass). Implication for this build:

- Keep the `upload` module's S3 code as-is structurally (it's the intended long-term path and matches "don't deviate from conventions").
- **Do not** block development on AWS credentials being production-ready; treat the current `.env` AWS values as placeholders.
- The `generate-upload-url` route's missing `auth()` (see §13 below) must still be fixed regardless of which storage backend ends up live, since a pre-signed URL endpoint open to the public is a real abuse vector (arbitrary anonymous uploads to the bucket) independent of whether S3 or imgbb is the final target.
- The Phase 3 review-photo feature and any admin product-image upload should go through this same `upload` module so swapping the backend later (S3 → confirmed production S3, or an imgbb adapter) is a one-module change.

## 3. Feature-by-feature status (audited against the client's 13 requirements)

| # | Client requirement | Status | Notes |
|---|---|---|---|
| 1 | Homepage | Frontend concern | Backend just needs to serve products/categories, already covered by items 2-3 |
| 2 | Product Categories (basic) | **EXISTS** | `category` module: name, slug, description, isActive, thumbnail. CRUD present. |
| 3 | Product Page (zoom image, variant images, variant price, stock by variant) | **EXISTS** | `product.model.ts` variant sub-schema has `images[]`, `price`, `discountPrice`, `stock` per variant already. Zoom is a frontend concern, images are already served per variant. |
| 4 | Product Variants | **EXISTS** | Same variant sub-schema, includes `sku`, `attributes` (flexible key-value), `isAvailable`. |
| 5 | Shopping Cart | **EXISTS** | `cart` module present with its own controller/service/model. |
| 6 | Checkout (guest, no login required) | **EXISTS but needs a fix** | `order` module creates orders with `shippingAddress`, `paymentMethod`, item snapshots. `placeOrder` reads `items` from the request body (not from the saved `Cart` doc) and unconditionally clears the cart at the end — fine as long as the frontend always submits exactly what's in the cart. Client requirement: **first-time customers must not need to sign up/login to place an order.** `POST /auth/guest-checkout` already exists for this — given `{ email, fullName, phone }` it finds-or-creates a `User` with password `DEFAULT_USER_PASS` (`123456` in `.env`) and returns a JWT, which the frontend then uses to call `POST /orders` normally. **Bug found:** when the email already belongs to an existing account, `guestCheckout` issues a valid JWT for that account with **no password check at all** — any returning customer's email can be used to obtain a session for their account. Must fix before shipping: if the email already exists, do not silently log them in — require a real login (or a password-verified guest flow) instead. See §3.1. |
| 7a | Account Dashboard / Profile Update / Password Change | **EXISTS** | `GET/PATCH /users/me`, `POST /users/me/change-password` all present in `route.user.ts`. |
| 7b | Order History | **EXISTS (verify)** | Order model is user-scoped (`user` field, indexed). Confirm a "my orders" list endpoint exists on the order routes; if not, it's a small addition (list + filter by `req.user.id`), not a new module. |
| 7c | Saved Address | **EXISTS** | Full CRUD in `user` module: add/list/update/delete/set-default, capped at 5 addresses, auto-saves from checkout. |
| 7d | Wishlist | **MISSING** | No field or module anywhere in the codebase. New small module needed: `wishlist` (user-scoped array of product refs, or a dedicated collection if it needs its own timestamps per item). |
| 8 | Admin Panel (basic) | **PARTIAL** | Role-gated user management already exists (list/block/unblock/delete/change-role, superAdmin only). Product and category modules likely have admin CRUD routes too, verify during implementation. Missing: a simple admin dashboard summary endpoint (order count, revenue total, low-stock variants) if the client expects a dashboard view, not just raw CRUD. |
| 9 | Shipping System | **PARTIAL** | Order has a flat `shippingCharge` number field only, no rules behind it. For basic scope: a small `shipping` settings module (flat rate, or rate-by-district) is enough, do not over-build a full carrier-integration system for an $85 job. |
| 10 | SEO Features | **PARTIAL** | Product has `metaTitle`/`metaDescription` and SEO-friendly `slug`. Category has `slug` but no meta fields, add them for consistency. Missing entirely: a sitemap.xml endpoint and Search Console verification (usually just a static meta tag or file, confirm with the client whether that's a frontend or backend concern for their stack). |
| 11 | Marketing Features (FB Pixel, GA, GTM, Search Console tag, Conversion API, WhatsApp/Messenger floating buttons) | **MISSING** | No settings/config storage anywhere. Needs one new `settings` module (single-document or key-value store) holding: `fbPixelId`, `gaId`, `gtmId`, `searchConsoleTag`, `fbConversionApiToken`, `whatsappNumber`, `messengerPageId`. Most of these render on the frontend from these values; Conversion API additionally needs a small server-side call to Meta's endpoint whenever an order/purchase event fires, this is the heaviest single item in the whole list, flag it to the client as a stretch item if time runs short. |
| 12 | Reviews (verified purchase, photo review, rating, approval) | **PARTIAL, and insecure as-is** | Not fully missing: `POST /products/:productId/review` + `productServices.addReviewRating` ([service.product.ts:224](../src/app/modules/product/service.product.ts#L224)) already updates `rating`/`reviewCount`. But it has no `Review` model, no photo, no approval workflow, and **no ownership/delivery verification** — it accepts any `orderId`/`variantId` from the request body without checking they belong to the requesting user or that the order is delivered, so anyone can inflate/spam a product's rating. Phase 3 must build a proper `review` module (own model, photo via `upload`, `status: pending/approved/rejected`, rating recalculated only on approval) and **replace** this endpoint rather than leave both live. |
| 13 | Security | **PARTIAL** | Already has: JWT auth, bcrypt password hashing, Zod input validation, centralized error handling, CORS allowlist. Missing/worth adding for a public-facing store: `helmet` for HTTP headers, basic rate limiting on auth/order endpoints (e.g. `express-rate-limit`), and Mongo injection sanitization on request bodies. Also: **the CORS allowlist in `app.ts` currently only allows `sultan-bazar.com` origins, this must be updated to `hydraazone.com` before anything works from the new frontend.** Two additional holes found during audit, both Phase 1: (a) `POST /uploads/generate-upload-url` ([route.upload.ts:14](../src/app/modules/upload/route.upload.ts#L14)) has its `auth()` middleware commented out — currently open to anyone, unauthenticated; (b) `guestCheckout` issues a JWT for an existing account without a password check — see §3.1. |
| — | COD selling | **EXISTS** | `paymentMethod` enum already includes `'cod'` and it's a required field with no gateway dependency, this is already the easiest requirement on the list. |

## 4. New modules to build (summary)

1. `wishlist` — small, user-scoped
2. `review` — medium, ties into product + order + upload modules
3. `settings` — small, single-document config store for marketing IDs + shipping rate
4. Security hardening pass on `app.ts` (helmet, rate limiting, sanitize) — not a module, a cross-cutting change

## 5. Build phases

**Phase 1 (core store, do this first):** fix CORS for hydraazone.com, fix `guestCheckout` password-check hole (§3.1), fix missing `auth()` on `generate-upload-url`, verify checkout reads-cart-clears-cart flow, verify order history endpoint exists, confirm admin CRUD on product/category. This phase is mostly verification + small security fixes, not new code.

**Phase 2 (account completeness + new small modules):** `wishlist` module, `settings` module (marketing IDs + shipping rate, even before wiring Conversion API), category SEO fields, admin dashboard summary endpoint.

**Phase 3 (heavier/stretch items):** `review` module (full: submission, photo upload, approval, rating recalculation), Facebook Conversion API server-side event call, sitemap.xml generation, security hardening pass.

## 6. Acceptance checklist (mark off as shipped)

- [x] CORS updated to hydraazone.com, old Sultan Bazar origins removed (`src/app.ts`)
- [x] Guest checkout: new email auto-creates account (password `123456`) and places order with no login; existing email is NOT auto-logged-in (requires real login instead) — `auth/service.auth.ts` `guestCheckout()`
- [x] `generate-upload-url` route requires auth again — and the whole `upload` module is now actually wired into `routes/index.ts` (it wasn't mounted anywhere before, so the route was previously unreachable regardless of the auth bug)
- [x] Checkout: cart -> order -> cart cleared — confirmed as designed; `placeOrder` trusts the `items` array the frontend submits (which should mirror the cart) and always clears the cart afterward
- [x] Order history endpoint returns the logged-in user's own orders only — `GET /orders/my-orders`, pre-existing
- [x] Wishlist: add/remove/list, user-scoped — new `wishlist` module
- [x] Admin: product/category/order CRUD confirmed role-gated correctly — pre-existing, verified
- [x] Admin dashboard summary endpoint (order count, revenue, low stock) — `GET /orders/analytics/dashboard`
- [x] Shipping: flat rate applied at checkout, now overridable via `PATCH /settings` (`shippingRate`/`freeShippingThreshold`), falling back to the `SHIPPING_CHARGE`/`FREE_SHIPPING_THRESHOLD` constants when unset
- [x] SEO: category meta fields added (`metaTitle`/`metaDescription`), `GET /sitemap.xml` live (active products + active categories)
- [x] Settings module: marketing IDs + shipping/dashboard config stored via `PATCH /settings` (admin), readable by the frontend via `GET /settings` (public projection — excludes the `fbConversionApiToken` secret)
- [x] Reviews: new `review` module (verified purchase from a delivered order, photo URLs, admin approval, rating recalculated from approved reviews only) replaces the old unguarded `addReviewRating` endpoint, which has been removed
- [x] Security: `helmet()`, rate limiting on `/auth/*` and `POST /orders`, a custom Mongo-injection sanitizer on `req.body`/`req.params` (`express-mongo-sanitize` was deliberately not used — it reassigns `req.query`, which throws under Express 5's read-only query getter)
- [ ] Full flow smoke test as a guest (no account) customer: browse -> add to cart -> checkout with COD (auto-creates account) -> see order in history after logging in with `123456` -> leave a review after delivery — **needs a real MongoDB connection to run; `DATABASE_URL` in `.env` is currently a placeholder, so this hasn't been exercised end-to-end yet.** Code compiles clean (`npx tsc --noEmit`) and the server boots through to the Mongo-connect step with no import/wiring errors.
- [ ] AWS S3 credentials confirmed production-ready before go-live (currently placeholder values; imgbb is what's actually live on Sultan Bazar today) — client's own action item before launch, not a code task
