export const ORDER_STATUS = {
    pending: 'pending',
    confirmed: 'confirmed',
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
    returned: 'returned',
} as const;

export const PAYMENT_METHOD = {
    cod: 'cod',
    bkash: 'bkash',
    nagad: 'nagad',
    card: 'card',
    bank: 'bank',
} as const;

export const PAYMENT_STATUS = {
    pending: 'pending',
    paid: 'paid',
    failed: 'failed',
    refunded: 'refunded',
} as const;

/** Orders with subtotal >= this value get free shipping */
export const FREE_SHIPPING_THRESHOLD = 10000;

/** Flat shipping charge when below the threshold (BDT) */
export const SHIPPING_CHARGE = 60;
