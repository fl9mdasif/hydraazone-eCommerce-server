/*
 * Development seed for HydraaZone.
 *
 * Run from the `server/` folder:   node scripts/seed.js
 *
 * Inserts categories, active products with variants, a settings document and
 * two accounts, so the client can be built and verified against live data.
 *
 * Safe to re-run: every write is an upsert keyed on slug/email, so it tops up
 * missing records instead of duplicating them. It never deletes anything.
 *
 * Imagery is deliberately picsum.photos placeholder URLs — obviously
 * disposable dev data, to be replaced by the real catalogue and photography.
 */

const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const img = (seed, size = 900) =>
  `https://picsum.photos/seed/${seed}/${size}/${size}`;

/* ------------------------------------------------------------------ schemas */
// Mirror the model files under server/src/app/modules exactly.

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    contactNumber: String,
    address: String,
    profilePicture: String,
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'superAdmin'], default: 'user' },
    isBlocked: { type: Boolean, default: false },
    passwordChangedAt: Date,
    savedAddresses: [
      {
        label: String,
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String, required: true },
        postalCode: String,
        country: { type: String, default: 'Bangladesh' },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    isActive: { type: Boolean, default: true },
    thumbnail: String,
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true },
);

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  discountPrice: Number,
  stock: { type: Number, required: true, default: 0 },
  weight: Number,
  images: [String],
  isAvailable: { type: Boolean, default: true },
  attributes: { type: Map, of: String },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: [String],
    thumbnail: { type: String, required: true },
    gallery: [String],
    variants: { type: [variantSchema], required: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true },
);

const settingsSchema = new mongoose.Schema(
  {
    fbPixelId: String,
    gaId: String,
    gtmId: String,
    searchConsoleTag: String,
    fbConversionApiToken: String,
    whatsappNumber: String,
    messengerPageId: String,
    shippingRate: Number,
    freeShippingThreshold: Number,
    lowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true },
);

// Mirrors server/src/app/modules/order/model.order.ts exactly.
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: {
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: Number,
  },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true },
  isReviewed: { type: Boolean, default: false },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  postalCode: String,
  country: { type: String, default: 'Bangladesh' },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { type: String, required: true, unique: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ['cod', 'bkash', 'nagad', 'card', 'bank'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionId: String,
    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        note: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    note: String,
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Settings = mongoose.model('Settings', settingsSchema);
const Order = mongoose.model('Order', orderSchema);

/* --------------------------------------------------------------- seed data */

const CATEGORIES = [
  {
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Considered pieces for the way you live every day.',
    thumbnail: img('hz-cat-home', 400),
    metaTitle: 'Home & Living — HydraaZone',
    metaDescription:
      'Furniture, decor and everyday essentials chosen for quality and calm.',
  },
  {
    name: 'Beauty & Care',
    slug: 'beauty-care',
    description: 'Clean, conscious formulations crafted for you.',
    thumbnail: img('hz-cat-beauty', 400),
    metaTitle: 'Beauty & Care — HydraaZone',
    metaDescription: 'Skincare and personal care products you can trust.',
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Everyday technology that simply works.',
    thumbnail: img('hz-cat-electronics', 400),
    metaTitle: 'Electronics — HydraaZone',
    metaDescription: 'Audio, wearables and home technology with real warranties.',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'The finishing details that carry a look.',
    thumbnail: img('hz-cat-accessories', 400),
    metaTitle: 'Accessories — HydraaZone',
    metaDescription: 'Bags, watches and small leather goods built to last.',
  },
  {
    name: 'Kitchen',
    slug: 'kitchen',
    description: 'Tools that earn their place on the counter.',
    thumbnail: img('hz-cat-kitchen', 400),
    metaTitle: 'Kitchen — HydraaZone',
    metaDescription: 'Cookware, storage and small appliances for real kitchens.',
  },
  {
    name: 'Health & Wellness',
    slug: 'health-wellness',
    description: 'Everyday support for feeling your best.',
    thumbnail: img('hz-cat-health', 400),
    metaTitle: 'Health & Wellness — HydraaZone',
    metaDescription: 'Supplements and wellness essentials, honestly labelled.',
  },
  {
    name: 'Tableware Collection',
    slug: 'tableware-collection',
    description: 'Made-to-measure table protection and everyday tableware.',
    thumbnail: img('hz-cat-tableware', 400),
    metaTitle: 'Tableware Collection — HydraaZone',
    metaDescription: 'Custom-size table covers, runners and placemats.',
  },
];

/**
 * Custom-size products (see client/src/components/store/table-cover-calculator.tsx)
 * price by SQUARE INCH, not a fixed variant price. Each variant's `price` is
 * therefore ratePerSqFt / 144 — a rate PER SQUARE INCH — so that
 * `variant.price * squareInches` (computed identically client- and
 * server-side, since the server just does price * quantity) reproduces the
 * intended per-square-foot rate exactly, with zero rounding drift on any
 * whole-inch dimension. `attributes.ratePerSqFt` is the human-readable rate
 * the client reads to render the thickness cards; it is NOT read by the
 * server and has no bearing on what is actually charged — that is entirely
 * `variant.price`, kept in lockstep with it here at seed time.
 */
const RATE_PER_SQFT = { '1mm': 80, '1.5mm': 110, '2mm': 140 };
const sqInRate = (rateSqFt) => rateSqFt / 144;

/** price/discountPrice in BDT. */
const PRODUCTS = [
  {
    name: 'Classic Leather Handbag',
    slug: 'classic-leather-handbag',
    category: 'accessories',
    description:
      'A structured everyday handbag in full-grain leather, with a soft suede lining and a detachable shoulder strap. Designed to hold its shape for years rather than seasons.',
    tags: ['bag', 'leather', 'everyday'],
    isFeatured: true,
    rating: 4.6,
    reviewCount: 126,
    variants: [
      { name: 'Tan', sku: 'HZ-BAG-CLH-TAN', price: 5900, discountPrice: 4900, stock: 18, attributes: { colour: 'Tan' } },
      { name: 'Black', sku: 'HZ-BAG-CLH-BLK', price: 5900, stock: 12, attributes: { colour: 'Black' } },
    ],
  },
  {
    name: 'Smart Watch Pro',
    slug: 'smart-watch-pro',
    category: 'electronics',
    description:
      'AMOLED display, seven-day battery life and continuous heart-rate tracking. Water resistant to 5ATM, with a quick-release strap that fits any 22mm band.',
    tags: ['watch', 'wearable', 'fitness'],
    isFeatured: true,
    rating: 4.4,
    reviewCount: 96,
    variants: [
      { name: 'Graphite', sku: 'HZ-ELC-SWP-GRA', price: 8900, discountPrice: 6900, stock: 24, attributes: { colour: 'Graphite' } },
      { name: 'Silver', sku: 'HZ-ELC-SWP-SIL', price: 8900, stock: 7, attributes: { colour: 'Silver' } },
    ],
  },
  {
    name: 'Eau De Parfum — Amber',
    slug: 'eau-de-parfum-amber',
    category: 'beauty-care',
    description:
      'A warm amber base lifted with bergamot and cedar. Long-wearing without being heavy, in a refillable weighted glass bottle.',
    tags: ['fragrance', 'amber'],
    isFeatured: true,
    rating: 4.8,
    reviewCount: 74,
    variants: [
      { name: '50ml', sku: 'HZ-BTY-EDP-050', price: 3900, stock: 30, weight: 220, attributes: { size: '50ml' } },
      { name: '100ml', sku: 'HZ-BTY-EDP-100', price: 6400, discountPrice: 5600, stock: 14, weight: 380, attributes: { size: '100ml' } },
    ],
  },
  {
    name: 'Modern Lounge Armchair',
    slug: 'modern-lounge-armchair',
    category: 'home-living',
    description:
      'A low-profile armchair with a solid oak frame and a high-resilience foam seat. Upholstered in a textured boucle that wears in rather than out.',
    tags: ['furniture', 'chair', 'oak'],
    isFeatured: true,
    rating: 4.5,
    reviewCount: 41,
    variants: [
      { name: 'Oatmeal', sku: 'HZ-HOM-MLA-OAT', price: 24900, discountPrice: 19900, stock: 5, attributes: { colour: 'Oatmeal' } },
      { name: 'Charcoal', sku: 'HZ-HOM-MLA-CHR', price: 24900, stock: 3, attributes: { colour: 'Charcoal' } },
    ],
  },
  {
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    category: 'electronics',
    description:
      'Over-ear active noise cancelling with 40 hours of playback and multipoint pairing. Memory-foam earcups and a folding hinge for travel.',
    tags: ['audio', 'anc', 'travel'],
    isFeatured: true,
    rating: 4.7,
    reviewCount: 213,
    variants: [
      { name: 'Midnight', sku: 'HZ-ELC-WHP-MID', price: 12900, discountPrice: 9900, stock: 22, attributes: { colour: 'Midnight' } },
      { name: 'Ivory', sku: 'HZ-ELC-WHP-IVY', price: 12900, stock: 0, isAvailable: true, attributes: { colour: 'Ivory' } },
    ],
  },
  {
    name: 'Vitamin C Serum',
    slug: 'vitamin-c-serum',
    category: 'beauty-care',
    description:
      'A 15% stabilised vitamin C serum with hyaluronic acid and vitamin E. Fragrance free, in amber glass to keep the formula stable.',
    tags: ['skincare', 'serum'],
    isFeatured: true,
    rating: 4.3,
    reviewCount: 189,
    variants: [
      { name: '30ml', sku: 'HZ-BTY-VCS-030', price: 2400, discountPrice: 1900, stock: 46, attributes: { size: '30ml' } },
    ],
  },
  {
    name: 'Ceramic Vase Set',
    slug: 'ceramic-vase-set',
    category: 'home-living',
    description:
      'A set of three hand-thrown stoneware vases in complementary heights, finished in a matte glaze. Each piece varies slightly.',
    tags: ['decor', 'ceramic'],
    rating: 4.6,
    reviewCount: 33,
    variants: [
      { name: 'Set of 3', sku: 'HZ-HOM-CVS-SET', price: 4200, stock: 16, attributes: { pieces: '3' } },
    ],
  },
  {
    name: 'Cast Iron Skillet 26cm',
    slug: 'cast-iron-skillet-26cm',
    category: 'kitchen',
    description:
      'Pre-seasoned cast iron that moves from hob to oven and improves with every use. Helper handle and a pour spout on each side.',
    tags: ['cookware', 'cast-iron'],
    rating: 4.9,
    reviewCount: 58,
    variants: [
      { name: '26cm', sku: 'HZ-KIT-CIS-026', price: 3600, discountPrice: 2900, stock: 21, weight: 2300, attributes: { size: '26cm' } },
      { name: '30cm', sku: 'HZ-KIT-CIS-030', price: 4600, stock: 9, weight: 3100, attributes: { size: '30cm' } },
    ],
  },
  {
    name: 'Insulated Water Bottle',
    slug: 'insulated-water-bottle',
    category: 'kitchen',
    description:
      'Double-walled stainless steel that keeps drinks cold for 24 hours or hot for 12. Powder-coated finish and a leakproof lid.',
    tags: ['bottle', 'steel'],
    rating: 4.5,
    reviewCount: 145,
    variants: [
      { name: '500ml — Sand', sku: 'HZ-KIT-IWB-500', price: 1800, stock: 60, attributes: { size: '500ml', colour: 'Sand' } },
      { name: '750ml — Sand', sku: 'HZ-KIT-IWB-750', price: 2200, discountPrice: 1850, stock: 38, attributes: { size: '750ml', colour: 'Sand' } },
    ],
  },
  {
    name: 'Minimal Leather Wallet',
    slug: 'minimal-leather-wallet',
    category: 'accessories',
    description:
      'A slim bifold in vegetable-tanned leather with six card slots and a full-length note pocket. Develops a patina with use.',
    tags: ['wallet', 'leather'],
    rating: 4.4,
    reviewCount: 87,
    variants: [
      { name: 'Chestnut', sku: 'HZ-ACC-MLW-CHT', price: 2600, stock: 34, attributes: { colour: 'Chestnut' } },
      { name: 'Black', sku: 'HZ-ACC-MLW-BLK', price: 2600, discountPrice: 2200, stock: 4, attributes: { colour: 'Black' } },
    ],
  },
  {
    name: 'Daily Multivitamin',
    slug: 'daily-multivitamin',
    category: 'health-wellness',
    description:
      'A once-daily tablet covering 23 vitamins and minerals at meaningful doses. Third-party tested, with the full panel printed on the label.',
    tags: ['supplement', 'daily'],
    rating: 4.2,
    reviewCount: 62,
    variants: [
      { name: '60 tablets', sku: 'HZ-HLT-DMV-060', price: 1600, stock: 52, attributes: { count: '60' } },
      { name: '120 tablets', sku: 'HZ-HLT-DMV-120', price: 2800, discountPrice: 2400, stock: 27, attributes: { count: '120' } },
    ],
  },
  {
    name: 'Linen Bedding Set',
    slug: 'linen-bedding-set',
    category: 'home-living',
    description:
      'Stonewashed French linen that starts soft and keeps getting softer. Includes a duvet cover and two pillowcases.',
    tags: ['bedding', 'linen'],
    rating: 4.7,
    reviewCount: 51,
    variants: [
      { name: 'Queen — Mist', sku: 'HZ-HOM-LBS-QMI', price: 11900, discountPrice: 8900, stock: 11, attributes: { size: 'Queen', colour: 'Mist' } },
      { name: 'King — Mist', sku: 'HZ-HOM-LBS-KMI', price: 13900, stock: 6, attributes: { size: 'King', colour: 'Mist' } },
    ],
  },
  {
    name: 'Transparent Table Cover',
    slug: 'transparent-table-cover',
    category: 'tableware-collection',
    description:
      'Protect your dining table with crystal-clear premium PVC, made to your exact size. Enter your length and width, choose a thickness, and we cut it to fit — no minimum order, no standard sizes to compromise on.\n\nMade according to your exact size. Length can be any measurement; maximum width is 48 inches. Price is calculated automatically from your entered area. Suitable for dining tables, office desks, study tables and kitchen counters.',
    // The product-detail route checks this tag to render the size
    // calculator (table-cover-calculator.tsx) instead of the normal
    // variant-picker product page.
    tags: ['custom-size', 'tableware', 'pvc'],
    isFeatured: true,
    rating: 4.8,
    reviewCount: 214,
    variants: [
      {
        name: '1mm',
        sku: 'HZ-TBL-TTC-1MM',
        price: sqInRate(RATE_PER_SQFT['1mm']),
        stock: 500000,
        attributes: {
          thickness: '1mm',
          ratePerSqFt: String(RATE_PER_SQFT['1mm']),
          label: 'Premium Transparent PVC',
        },
      },
      {
        name: '1.5mm',
        sku: 'HZ-TBL-TTC-1_5MM',
        price: sqInRate(RATE_PER_SQFT['1.5mm']),
        stock: 500000,
        attributes: {
          thickness: '1.5mm',
          ratePerSqFt: String(RATE_PER_SQFT['1.5mm']),
          label: 'Extra Durable',
          mostPopular: 'true',
        },
      },
      {
        name: '2mm',
        sku: 'HZ-TBL-TTC-2MM',
        price: sqInRate(RATE_PER_SQFT['2mm']),
        stock: 500000,
        attributes: {
          thickness: '2mm',
          ratePerSqFt: String(RATE_PER_SQFT['2mm']),
          label: 'Heavy Duty Premium Quality',
        },
      },
    ],
  },
];

const ACCOUNTS = [
  {
    username: 'hydraa_admin',
    email: 'admin@hydraazone.com',
    password: 'Admin@123',
    role: 'superAdmin',
    contactNumber: '01700000001',
  },
  // Plain `admin` role, distinct from the superAdmin account above — needed
  // to test the dashboard's role-scoping (admin should NOT see the Users
  // nav item or reach /dashboard/superadmin).
  {
    username: 'hydraa_manager',
    email: 'manager@hydraazone.com',
    password: 'Manager@123',
    role: 'admin',
    contactNumber: '01700000003',
  },
  {
    username: 'hydraa_customer',
    email: 'customer@hydraazone.com',
    password: 'Customer@123',
    role: 'user',
    contactNumber: '01700000002',
  },
];

/* ------------------------------------------------------------------- runner */

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL is not set in server/.env');

  await mongoose.connect(uri);
  console.log('connected to mongodb\n');

  /* categories */
  const categoryIds = {};
  for (const category of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: { ...category, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categoryIds[category.slug] = doc._id;
    console.log(`category  ${category.slug}`);
  }

  /* products */
  for (const product of PRODUCTS) {
    const categoryId = categoryIds[product.category];
    if (!categoryId) throw new Error(`unknown category ${product.category}`);

    const variants = product.variants.map((variant, index) => ({
      isAvailable: true,
      images: [img(`${product.slug}-v${index}`)],
      ...variant,
    }));

    await Product.findOneAndUpdate(
      { slug: product.slug },
      {
        $set: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: categoryId,
          tags: product.tags ?? [],
          thumbnail: img(product.slug),
          gallery: [img(`${product.slug}-a`), img(`${product.slug}-b`)],
          variants,
          rating: product.rating ?? 0,
          reviewCount: product.reviewCount ?? 0,
          status: 'active',
          isFeatured: Boolean(product.isFeatured),
          metaTitle: `${product.name} — HydraaZone`,
          metaDescription: product.description.slice(0, 155),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`product   ${product.slug}`);
  }

  /* accounts */
  const rounds = Number(process.env.BCRYPT_SALT_ROUND) || 12;
  for (const account of ACCOUNTS) {
    const existing = await User.findOne({ email: account.email });
    if (existing) {
      console.log(`account   ${account.email} (already exists, left alone)`);
      continue;
    }
    await User.create({
      ...account,
      password: await bcrypt.hash(account.password, rounds),
    });
    console.log(`account   ${account.email} / ${account.password} [${account.role}]`);
  }

  /*
   * Historical delivered orders, spread over the past 30 days.
   *
   * Without this, the admin dashboard's revenue chart has at most one real
   * data point (whatever orders happen to exist from manual testing) — a
   * single point has no line to draw, just a dot. This gives
   * `GET /orders/analytics/sales` a genuine multi-day time series to plot,
   * built entirely from real seeded products/variants and their real
   * prices — nothing here is a fabricated number once it lands in the DB,
   * it's a real Order document like any other, just backdated.
   *
   * Idempotent like everything else here: deterministic `orderNumber`s
   * (`SEED-ORD-0001` etc.) mean a re-run upserts the same 24 orders rather
   * than piling up duplicates.
   */
  const customer = await User.findOne({ email: 'customer@hydraazone.com' });
  const allProducts = await Product.find({ status: 'active' });

  if (customer && allProducts.length > 0) {
    const SEED_ORDER_COUNT = 24;
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    for (let i = 0; i < SEED_ORDER_COUNT; i += 1) {
      const orderNumber = `SEED-ORD-${String(i + 1).padStart(4, '0')}`;
      const existing = await Order.findOne({ orderNumber });
      if (existing) continue;

      // Spread across the last 30 days, 1-2 orders per day, so both the
      // "daily" and "monthly" analytics periods have something real to show.
      const daysAgo = Math.floor((i / SEED_ORDER_COUNT) * 30);
      const createdAt = new Date(now - daysAgo * DAY_MS - Math.floor(Math.random() * DAY_MS));

      // 1-3 line items from the real catalogue, real prices.
      const itemCount = 1 + Math.floor(Math.random() * 3);
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < itemCount; j += 1) {
        const product = allProducts[Math.floor(Math.random() * allProducts.length)];
        const variant = product.variants[Math.floor(Math.random() * product.variants.length)];
        if (!variant) continue;

        const quantity = 1 + Math.floor(Math.random() * 2);
        const price = variant.discountPrice ?? variant.price;
        const totalPrice = price * quantity;
        subtotal += totalPrice;

        items.push({
          product: product._id,
          variant: {
            variantId: variant._id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            discountPrice: variant.discountPrice,
          },
          quantity,
          totalPrice,
          isReviewed: false,
        });
      }

      if (items.length === 0) continue;

      const shippingCharge = subtotal >= 10000 ? 0 : 60;
      const totalAmount = subtotal + shippingCharge;
      const deliveredAt = new Date(createdAt.getTime() + 2 * DAY_MS);

      const order = new Order({
        user: customer._id,
        orderNumber,
        items,
        shippingAddress: {
          fullName: 'Hydraa Customer',
          phone: '01700000002',
          address: 'House 12, Road 5, Block C',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1216',
          country: 'Bangladesh',
        },
        paymentMethod: 'cod',
        // A mix, so the admin dashboard's payment-status donut has more
        // than one real slice instead of everything landing in one bucket.
        paymentStatus: ['paid', 'paid', 'paid', 'pending', 'refunded'][i % 5],
        subtotal,
        shippingCharge,
        discount: 0,
        totalAmount,
        orderStatus: 'delivered',
        statusHistory: [
          { status: 'pending', note: 'Order placed', changedAt: createdAt },
          { status: 'delivered', note: 'Delivered', changedAt: deliveredAt },
        ],
        deliveredAt,
      });

      // Backdate createdAt/updatedAt — Mongoose only auto-sets these when
      // absent, so setting them before save() makes the seed data actually
      // land on the days it claims to.
      order.createdAt = createdAt;
      order.updatedAt = deliveredAt;
      await order.save({ timestamps: false });
    }
    console.log(`orders    ${SEED_ORDER_COUNT} historical delivered orders (idempotent)`);
  } else {
    console.log('orders    skipped (no customer account or no active products yet)');
  }

  /* settings singleton */
  await Settings.findOneAndUpdate(
    {},
    {
      $set: {
        shippingRate: 60,
        freeShippingThreshold: 10000,
        whatsappNumber: '8801700000000',
        lowStockThreshold: 5,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log('settings  shippingRate=60 freeShippingThreshold=10000');

  await mongoose.disconnect();
  console.log('\ndone.');
}

main().catch(async (error) => {
  console.error('\nseed failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
