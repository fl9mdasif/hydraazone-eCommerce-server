# HydraaZone, Postman request bodies (products + categories)

Verified against `server/src/app/modules/product/validation.product.ts` and `category/validation.category.ts`.

## Setup

| Setting | Value |
|---|---|
| Base URL | `http://localhost:5000/api/v1` (or your deployed API) |
| Method | `POST` |
| Endpoint | `/products` |
| Body type | raw, JSON |
| Auth | admin or superAdmin |

**Headers**

```
Content-Type: application/json
Authorization: <paste the accessToken exactly, with NO "Bearer " prefix>
```

The auth middleware runs `jwt.verify(req.headers.authorization)` directly, so adding `Bearer ` breaks every protected request. Get the token from the `data.accessToken` field of `POST /auth/login`.

---

## Step 1, create a category first

`POST /categories`. A product needs a real category ObjectId, so do this first and copy the returned `_id`.

```json
{
  "name": "Cooking Oil",
  "slug": "cooking-oil",
  "description": "Pure, locally sourced cooking oils with no added preservatives.",
  "thumbnail": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800",
  "isActive": true,
  "metaTitle": "Cooking Oil in Bangladesh | HydraaZone",
  "metaDescription": "Buy pure mustard, soybean and olive cooking oil online in Bangladesh. Cash on delivery available."
}
```

---

## Step 2, create a product

`POST /products`. Replace `category` with the `_id` you just got.

```json
{
  "name": "Premium Mustard Oil",
  "slug": "premium-mustard-oil",
  "description": "Cold pressed mustard oil from locally sourced seeds, with no added preservatives or artificial colour. Strong aroma and authentic pungency, ideal for everyday Bangladeshi cooking, pickles and marinades. Bottled in food grade PET.",
  "category": "PASTE_CATEGORY_ID_HERE",
  "tags": ["oil", "cooking", "mustard", "organic", "cold pressed"],
  "thumbnail": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800",
  "gallery": [
    "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800",
    "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800"
  ],
  "variants": [
    {
      "name": "250ml",
      "sku": "MUSTARD-OIL-250ML",
      "price": 180,
      "discountPrice": 165,
      "stock": 48,
      "weight": 250,
      "images": ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800"],
      "isAvailable": true,
      "attributes": { "volume": "250ml", "packaging": "PET bottle" }
    },
    {
      "name": "500ml",
      "sku": "MUSTARD-OIL-500ML",
      "price": 340,
      "discountPrice": 310,
      "stock": 32,
      "weight": 500,
      "images": ["https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800"],
      "isAvailable": true,
      "attributes": { "volume": "500ml", "packaging": "PET bottle" }
    },
    {
      "name": "1L",
      "sku": "MUSTARD-OIL-1L",
      "price": 650,
      "stock": 15,
      "weight": 1000,
      "images": ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800"],
      "isAvailable": true,
      "attributes": { "volume": "1L", "packaging": "Tin container" }
    }
  ],
  "status": "active",
  "isFeatured": true,
  "metaTitle": "Premium Cold Pressed Mustard Oil | HydraaZone",
  "metaDescription": "Buy cold pressed premium mustard oil online in Bangladesh. 250ml, 500ml and 1L packs. Cash on delivery available."
}
```

---

## Minimal valid product (only required fields)

Useful for quickly checking validation. Note it defaults to `status: "draft"`, so it will **not** appear on the storefront until you set `status` to `"active"`.

```json
{
  "name": "Test Product",
  "slug": "test-product",
  "description": "A minimal product created to test the create endpoint.",
  "category": "PASTE_CATEGORY_ID_HERE",
  "thumbnail": "https://placehold.co/800x800.png",
  "variants": [
    {
      "name": "Standard",
      "sku": "TEST-PRODUCT-STD",
      "price": 100,
      "stock": 10
    }
  ]
}
```

---

## A second product, so listing and filtering have something to work with

```json
{
  "name": "Organic Honey",
  "slug": "organic-honey",
  "description": "Raw, unpasteurised honey collected from the Sundarbans. Unfiltered, so natural crystallisation over time is expected and is a sign of purity.",
  "category": "PASTE_CATEGORY_ID_HERE",
  "tags": ["honey", "organic", "raw", "sundarbans"],
  "thumbnail": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800",
  "gallery": ["https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800"],
  "variants": [
    {
      "name": "500g Jar",
      "sku": "HONEY-RAW-500G",
      "price": 750,
      "discountPrice": 699,
      "stock": 20,
      "weight": 500,
      "isAvailable": true,
      "attributes": { "weight": "500g", "origin": "Sundarbans" }
    },
    {
      "name": "1kg Jar",
      "sku": "HONEY-RAW-1KG",
      "price": 1400,
      "stock": 3,
      "weight": 1000,
      "isAvailable": true,
      "attributes": { "weight": "1kg", "origin": "Sundarbans" }
    }
  ],
  "status": "active",
  "isFeatured": false,
  "metaTitle": "Raw Sundarbans Organic Honey | HydraaZone",
  "metaDescription": "Buy raw unfiltered Sundarbans honey online in Bangladesh. 500g and 1kg jars, cash on delivery."
}
```

The `1kg Jar` variant has `stock: 3`, which sits at or below the default `lowStockThreshold` of 5, so it will show up in `GET /orders/analytics/dashboard` low stock results. Handy for testing that panel.

---

## Update a single variant

`PATCH /products/:productId/variants/:variantId`, admin only. At least one field is required.

```json
{
  "price": 360,
  "discountPrice": 325,
  "stock": 50,
  "isAvailable": true
}
```

## Flip a draft product live

`PATCH /products/:productId`

```json
{
  "status": "active",
  "isFeatured": true
}
```

---

## The seven things that cause a 400 or 409 here

1. **`slug` must be lowercase letters, numbers and hyphens only.** `Premium_Mustard_Oil` and `premium mustard oil` both fail the regex.
2. **`sku` is a unique index across the entire products collection, not just within one product.** Reusing a SKU from another product returns a duplicate key error, so keep them distinct.
3. **`thumbnail` must be a valid URL**, and every entry in `gallery` and in each variant's `images` must be a valid URL too. A bare filename fails.
4. **`price` must be a positive number, not a string.** `"price": "340"` fails. So does `0`.
5. **All `attributes` values must be strings.** `{ "volume": 500 }` fails, use `{ "volume": "500ml" }`.
6. **`variants` needs at least one entry**, and each one needs `name`, `sku` and `price`.
7. **Duplicate `name` or `slug` returns 409.** The service does a case insensitive name check, so `premium mustard oil` collides with `Premium Mustard Oil`.

Also worth remembering: `status` defaults to `"draft"` and `GET /products` does not filter by status on its own. A draft product is invisible on a storefront that correctly requests `?status=active`, but it will still show up in an unfiltered admin listing.
