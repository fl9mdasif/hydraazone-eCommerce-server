# 🛒 Order API – Postman Test Examples

Base URL: `http://localhost:5000/api/orders`

> **Auth Header** (required on all routes unless noted):
> ```
> Authorization: Bearer <your_jwt_token>
> ```

---

## 1. Place Order
**`POST /api/orders`** — Logged-in user (any role)

```json
{
  "items": [
    {
      "productId": "665f1a2b3c4d5e6f7a8b9c01",
      "variantId": "665f1a2b3c4d5e6f7a8b9c02",
      "quantity": 2
    },
    {
      "productId": "665f1a2b3c4d5e6f7a8b9c03",
      "variantId": "665f1a2b3c4d5e6f7a8b9c04",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "fullName": "Md. Asif Hossain",
    "phone": "01712345678",
    "address": "House 12, Road 5, Block A",
    "city": "Dhaka",
    "district": "Dhaka",
    "postalCode": "1207",
    "country": "Bangladesh"
  },
  "paymentMethod": "cod",
  "discount": 50,
  "note": "Please deliver after 6PM"
}
```

**`paymentMethod` options:** `"cod"` | `"bkash"` | `"nagad"` | `"card"` | `"bank"`

---

## 2. Get My Orders
**`GET /api/orders/my-orders`** — Logged-in user (any role)

- No request body.
- No query params.

---

## 3. Get Single Order
**`GET /api/orders/:orderId`** — Owner or Admin

```
GET /api/orders/665f1a2b3c4d5e6f7a8b9c10
```

- No request body.

---

## 4. Get All Orders *(Admin only)*
**`GET /api/orders`** — Admin / SuperAdmin

Query params (all optional):

| Param    | Type   | Example         | Description              |
|----------|--------|-----------------|--------------------------|
| `status` | string | `pending`       | Filter by order status   |
| `page`   | number | `1`             | Page number (default: 1) |
| `limit`  | number | `20`            | Items per page (default: 20) |

**Example URL:**
```
GET /api/orders?status=pending&page=1&limit=10
```

**`status` options:** `pending` | `confirmed` | `processing` | `shipped` | `delivered` | `cancelled` | `returned`

---

## 5. Update Order Status *(Admin only)*
**`PATCH /api/orders/:orderId/status`** — Admin / SuperAdmin

```json
{
  "status": "confirmed",
  "note": "Payment verified, order confirmed"
}
```

**`status` options:** `"pending"` | `"confirmed"` | `"processing"` | `"shipped"` | `"delivered"` | `"cancelled"` | `"returned"`

> `note` is optional. When `status` is `"delivered"` → `deliveredAt` is auto-set.
> When `status` is `"cancelled"` → stock is automatically restored.

---

## 6. Update Payment Status *(Admin only)*
**`PATCH /api/orders/:orderId/payment-status`** — Admin / SuperAdmin

```json
{
  "paymentStatus": "paid",
  "transactionId": "TXN-20260302-ABC123"
}
```

**`paymentStatus` options:** `"pending"` | `"paid"` | `"failed"` | `"refunded"`

> `transactionId` is optional.

---

## 7. Cancel Order *(User only)*
**`PATCH /api/orders/:orderId/cancel`** — Logged-in user (own orders only)

```json
{
  "reason": "Changed my mind"
}
```

> Can only cancel orders with status `"pending"` or `"confirmed"`.
> `reason` is optional. Stock is automatically restored on cancellation.

---

## 🔐 Role Summary

| Route                                    | Method  | Required Role           |
|------------------------------------------|---------|-------------------------|
| `/api/orders`                            | POST    | user / admin / superAdmin |
| `/api/orders/my-orders`                  | GET     | user / admin / superAdmin |
| `/api/orders/:orderId`                   | GET     | user / admin / superAdmin |
| `/api/orders`                            | GET     | admin / superAdmin       |
| `/api/orders/:orderId/status`            | PATCH   | admin / superAdmin       |
| `/api/orders/:orderId/payment-status`    | PATCH   | admin / superAdmin       |
| `/api/orders/:orderId/cancel`            | PATCH   | user only                |
