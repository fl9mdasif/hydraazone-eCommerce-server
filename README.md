# HydraaZone Server

Backend API for **HydraaZone**, a Node.js/Express/TypeScript e-commerce server built on top of the existing Sultan Bazar codebase. This repository is the **backend only** — there is no frontend in this folder.

> Full requirements, audit notes, and outstanding items live in [`docs/PRD-server.md`](docs/PRD-server.md). Step-by-step build/implementation notes live in [`../claude.md`](../claude.md). This README documents how to run and use the server as it exists today.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js (18+) |
| Framework | Express 5 |
| Language | TypeScript (strict mode) |
| Database | MongoDB via Mongoose |
| Validation | Zod (`validateRequest` middleware, wired per-route) |
| Auth | JWT (access + refresh tokens), bcrypt password hashing |
| File uploads | AWS S3 pre-signed URLs (`@aws-sdk/client-s3`) |
| Transactional email | [Plunk](https://useplunk.com/) HTTP API (not Nodemailer/SMTP) |
| Security | `helmet`, `express-rate-limit`, a custom Mongo-injection sanitizer |

---

## Project Structure & Conventions

```
src/
  app.ts                  # Express app: CORS, helmet, sanitizer, route mounting
  server.ts               # Entry point: Mongo connect + superAdmin seed + listen
  app/
    config/                # Typed env var access (single source of truth)
    db/                    # One-time superAdmin seeding on boot
    errors/                # AppError + error shape
    middlewares/           # auth, validateRequest, rateLimiters, sanitizeInput, error handlers
    routes/index.ts        # Mounts every module's router under /api/v1
    utils/                 # catchAsync, sendResponse, jwt, sendEmail
    helpers/               # emailTemplate.ts, metaConversionApi.ts
    modules/<name>/        # one folder per feature
      controller.<name>.ts   # thin, wrapped in catchAsync
      service.<name>.ts      # all business logic + DB access
      model.<name>.ts        # Mongoose schema, { timestamps: true }
      interface.<name>.ts    # TypeScript types for the module
      route.<name>.ts         # (or router.<name>.ts — both spellings exist; match whichever a module already uses)
      validation.<name>.ts    # Zod schemas
```

**Any new module must follow this exact shape.** Controllers stay thin and are wrapped in `catchAsync`; all responses go through `response.createSendResponse` / `response.getSendResponse` (`utils/sendResponse.ts`); all thrown errors are `AppError` instances, caught by `globalErrorHandler`; every protected route is gated with `auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin)` naming exactly the roles allowed.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (Atlas or self-hosted)
- (Optional, for review-photo/product-image uploads) AWS S3 bucket + IAM credentials
- (Optional, for transactional email) a [Plunk](https://useplunk.com/) API key

### Install & run

```bash
npm install

# copy your own values into .env — see the table below
cp .env.example .env   # if you keep one; otherwise create .env manually

npm run dev      # ts-node-dev, auto-restarts on change
npm run build    # compiles to dist/
npm start        # runs the compiled build (dist/server.js)
```

The server listens on `PORT` (default `5000`) and mounts the API under `/api/v1`. On first boot it seeds a `superAdmin` user (`superAdmin@gmail.com`, password from `SUPER_ADMIN_PASS`) if one doesn't already exist.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | no | `production` enables secure cookies |
| `PORT` | no | defaults to `5000` |
| `DATABASE_URL` | **yes** | MongoDB connection string |
| `BCRYPT_SALT_ROUND` | **yes** | e.g. `12` |
| `DEFAULT_PASS` | no | unused legacy default, kept for compatibility |
| `SUPER_ADMIN_PASS` | **yes** | password for the auto-seeded `superAdmin` account |
| `DEFAULT_USER_PASS` | **yes** | password given to accounts auto-created via guest checkout (currently `123456`) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | **yes** | |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | **yes** | e.g. `1d` / `30d` |
| `PLUNK_SECRET_KEY` | for email | admin/shipped-order notification emails silently fail without it |
| `ADMIN_EMAIL` | for email | where new-order notifications are sent |
| `SITE_URL` | no | base URL used in `/sitemap.xml`; defaults to `https://www.hydraazone.com` |
| `AWS_S3_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET_NAME` | for uploads | **not currently set** — see "Known gaps" below; `POST /uploads/generate-upload-url` will fail without these |

Marketing/tracking IDs (FB Pixel, GA, GTM, WhatsApp number, etc.) and the shipping rate are **not** env vars — they're stored in the database via the `settings` module (see API reference) so they're editable at runtime without a redeploy.

---

## API Reference

Base URL: `/api/v1`. All request bodies are JSON. Authenticated routes expect `Authorization: <accessToken>` (the raw JWT, no `Bearer ` prefix) — set automatically as an httpOnly cookie on login/guest-checkout as well.

Roles: `user` | `admin` | `superAdmin`.

### Auth — `/auth`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | — | rate-limited |
| POST | `/login` | — | rate-limited |
| POST | `/guest-checkout` | — | rate-limited; find-or-create by email, see below |
| POST | `/change-password` | any | rate-limited |
| POST | `/logout` | — | clears cookies |
| POST | `/refresh-token` | — | reads `refreshToken` cookie |

**Guest checkout** (`POST /auth/guest-checkout`, body `{ email, fullName, phone }`) lets a first-time customer place an order with no signup step: a brand-new email silently creates an account (password `DEFAULT_USER_PASS`, role `user`) and returns a token. If the email already belongs to an existing account, this endpoint returns `409` and does **not** issue a token — the customer must use `/auth/login` instead, so a known email can never be used to obtain someone else's session without their password.

### Users — `/users`
| Method | Path | Auth |
|---|---|---|
| GET/POST | `/addresses` | any |
| PATCH/DELETE | `/addresses/:id` | any |
| PATCH | `/addresses/:id/default` | any |
| GET | `/me` | any |
| PATCH | `/me` | any |
| POST | `/me/change-password` | any |
| GET | `/` | admin, superAdmin |
| PATCH | `/:id/role` | superAdmin |
| PATCH | `/:id/block` | superAdmin |
| DELETE | `/:id` | superAdmin |

Saved addresses are capped at 5 per user and auto-populated from checkout.

### Categories — `/categories`
| Method | Path | Auth |
|---|---|---|
| GET | `/`, `/:idOrSlug` | — |
| POST | `/` | admin, superAdmin |
| PATCH | `/:id`, `/:id/toggle-status` | admin, superAdmin |
| DELETE | `/:id` | admin, superAdmin |

Includes `metaTitle`/`metaDescription` for SEO.

### Products — `/products`
| Method | Path | Auth |
|---|---|---|
| GET | `/` (search/category/price/status/pagination filters) | — |
| GET | `/:idOrSlug` | — |
| POST | `/` | admin, superAdmin |
| PATCH | `/:id`, `/:id/toggle-featured`, `/:id/variants/:variantId` | admin, superAdmin |
| DELETE | `/:id` | admin, superAdmin |

Each product has one or more **variants** (name, SKU, price, discount price, stock, images, attributes) — this is how size/weight options are modeled. `rating`/`reviewCount` are aggregate fields maintained by the `review` module, not settable directly.

### Cart — `/carts`
| Method | Path | Auth |
|---|---|---|
| GET, POST, DELETE | `/` | any |
| PATCH, DELETE | `/:productId/:variantId` | any |

One cart document per user.

### Orders — `/orders`
| Method | Path | Auth |
|---|---|---|
| POST | `/` | any (rate-limited) |
| GET | `/my-orders` | any — own orders only |
| GET | `/:orderId` | any — owner or admin/superAdmin |
| PATCH | `/:orderId/cancel` | user — only while `pending`/`confirmed` |
| GET | `/analytics/sales?period=daily\|monthly\|yearly` | admin, superAdmin |
| GET | `/analytics/dashboard` | admin, superAdmin — order count, delivered revenue, low-stock variants |
| GET | `/` | admin, superAdmin — paginated, filterable |
| PATCH | `/:orderId/status` | admin, superAdmin |
| PATCH | `/:orderId/payment-status` | admin, superAdmin |

Placing an order validates stock per variant, snapshots price/SKU onto the order, deducts stock, clears the user's cart, auto-saves the shipping address to their profile, and (fire-and-forget, never blocking the response) sends an admin notification email and a Meta Conversions API `Purchase` event. Shipping cost uses `Settings.shippingRate`/`freeShippingThreshold` when set, falling back to the constants in `order/const.order.ts`. **Payment is COD-only for this build** — `bkash`/`nagad`/`card`/`bank` exist in the schema for later but have no gateway wired up.

### Wishlist — `/wishlist`
| Method | Path | Auth |
|---|---|---|
| GET, POST | `/` | any |
| DELETE | `/:productId` | any |

### Reviews — `/reviews`
| Method | Path | Auth |
|---|---|---|
| GET | `/product/:productId` | — approved reviews only |
| POST | `/` | any — see gate below |
| GET | `/` (optional `?status=`) | admin, superAdmin |
| PATCH | `/:reviewId/status` | admin, superAdmin |

A review can only be submitted for a product/variant that's actually in an order the requester owns **and** that order's `orderStatus` is `delivered` — this is what makes it a verified purchase. One review per order-item (enforced by a unique index). New reviews start `pending` and don't affect the product's public `rating`; approving/rejecting a review recalculates the product's `rating`/`reviewCount` from the full set of currently-approved reviews.

### Settings — `/settings`
| Method | Path | Auth |
|---|---|---|
| GET | `/` | — public, safe projection only |
| PATCH | `/` | admin, superAdmin |

Singleton document holding `fbPixelId`, `gaId`, `gtmId`, `searchConsoleTag`, `whatsappNumber`, `messengerPageId`, `shippingRate`, `freeShippingThreshold`, `lowStockThreshold`. `fbConversionApiToken` can be written via `PATCH` but is **never** returned by the public `GET` — it's a server-side secret used only for the Conversions API call.

### Uploads — `/uploads`
| Method | Path | Auth |
|---|---|---|
| POST | `/generate-upload-url` | any |

Returns a pre-signed S3 PUT URL for direct-to-bucket uploads (product images, review photos). Requires the AWS env vars above to be set.

### Sitemap
`GET /sitemap.xml` — mounted at the app root (not under `/api/v1`), lists active products and categories.

---

## Security

- JWT auth with role checks (`middlewares/auth.ts`), bcrypt-hashed passwords, `passwordChangedAt` invalidates tokens issued before a password change
- `helmet()` for standard security headers
- `express-rate-limit` on `/auth/*` and `POST /orders`
- Zod validation on every mutating route
- A **custom** Mongo-injection sanitizer (`middlewares/sanitizeInput.ts`) strips `$`-prefixed and dotted keys from `req.body`/`req.params`. The popular `express-mongo-sanitize` package is intentionally **not** used — it reassigns `req.query`, which throws under Express 5 (query is a read-only getter there)
- CORS allowlist restricted to `hydraazone.com` / `www.hydraazone.com` / `localhost:3000` (`app.ts`)

---

## Deployment

- **Docker**: `Dockerfile` + `docker-compose.yml` build and run the compiled server (`npm run build && npm start`) on port `5000`, reading secrets from `.env`.
- **Vercel**: `vercel.json` routes all traffic to the compiled `dist/server.js` via `@vercel/node`. Run `npm run build` before deploying (or let Vercel's build step handle it).

---

## Known gaps (not blocking local development)

- `AWS_S3_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET_NAME` are not set in `.env` yet — production image hosting is currently imgbb, not S3. See [`docs/PRD-server.md §3.2`](docs/PRD-server.md) for context.
- No automated test suite yet — verification so far has been manual (`npx tsc --noEmit` + live smoke testing against a real MongoDB instance).

For the full requirements audit, phase-by-phase build history, and what's left, see [`docs/PRD-server.md`](docs/PRD-server.md) and [`../claude.md`](../claude.md).
