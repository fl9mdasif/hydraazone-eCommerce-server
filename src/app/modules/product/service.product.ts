import httpStatus from 'http-status';
import AppError from '../../errors/AppErrors';
import { TProduct } from './interface.product';
import { Product } from './model.product';
import mongoose from 'mongoose';

// ── Helpers ──────────────────────────────────────────────────────────────────
const isObjectId = (val: string) => /^[a-f\d]{24}$/i.test(val);

// ── Create ───────────────────────────────────────────────────────────────────
const createProduct = async (payload: TProduct) => {
    // Duplicate name check (case-insensitive)
    const existingName = await Product.findOne({
        name: { $regex: `^${payload.name}$`, $options: 'i' },
    });
    if (existingName) {
        throw new AppError(
            httpStatus.CONFLICT,
            `A product named '${existingName.name}' already exists.`,
            'Duplicate name',
        );
    }

    // Duplicate slug check
    const existingSlug = await Product.findOne({ slug: payload.slug });
    if (existingSlug) {
        throw new AppError(
            httpStatus.CONFLICT,
            `A product with slug '${payload.slug}' already exists.`,
            'Duplicate slug',
        );
    }

    const product = await Product.create(payload);
    return product.populate('category', 'name slug');
};

// ── Get All ──────────────────────────────────────────────────────────────────
const getAllProducts = async (query: Record<string, unknown>) => {
    const {
        search,
        category,
        status,
        isFeatured,
        minPrice,
        maxPrice,
        sort = '-createdAt',
        page = 1,
        limit = 12,
    } = query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    // Improved search (substring matching)
    if (search) {
        const searchTerm = search as string;
        filter.$or = [
            { name: { $regex: searchTerm, $options: 'i' } },
            { tags: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
        ];
    }

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (isFeatured !== undefined)
        filter.isFeatured = isFeatured === 'true' || isFeatured === true;

    // Price filter — applied to variants.price range
    if (minPrice || maxPrice) {
        filter['variants.price'] = {};
        if (minPrice) filter['variants.price'].$gte = Number(minPrice);
        if (maxPrice) filter['variants.price'].$lte = Number(maxPrice);
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
        Product.find(filter)
            .populate('category', 'name slug')
            .sort(sort as string)
            .skip(skip)
            .limit(limitNum),
        Product.countDocuments(filter),
    ]);

    return {
        data: products,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    };
};

// ── Get Single ───────────────────────────────────────────────────────────────
const getSingleProduct = async (idOrSlug: string) => {
    const product = isObjectId(idOrSlug)
        ? await Product.findById(idOrSlug).populate('category', 'name slug')
        : await Product.findOne({ slug: idOrSlug }).populate('category', 'name slug');

    if (!product) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Product not found',
            'No product found with the given id or slug',
        );
    }
    return product;
};

// ── Update ───────────────────────────────────────────────────────────────────
const updateProduct = async (id: string, payload: Partial<TProduct>) => {
    // Duplicate name check (case-insensitive, exclude self)
    if (payload.name) {
        const existingName = await Product.findOne({
            name: { $regex: `^${payload.name}$`, $options: 'i' },
            _id: { $ne: id },
        });
        if (existingName) {
            throw new AppError(
                httpStatus.CONFLICT,
                `A product named '${existingName.name}' already exists.`,
                'Duplicate name',
            );
        }
    }

    // Duplicate slug check (exclude self)
    if (payload.slug) {
        const existingSlug = await Product.findOne({
            slug: payload.slug,
            _id: { $ne: id },
        });
        if (existingSlug) {
            throw new AppError(
                httpStatus.CONFLICT,
                `A product with slug '${payload.slug}' already exists.`,
                'Duplicate slug',
            );
        }
    }

    const updated = await Product.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    }).populate('category', 'name slug');

    if (!updated) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Product not found',
            'No product found with the given id',
        );
    }
    return updated;
};

// ── Delete ───────────────────────────────────────────────────────────────────
const deleteProduct = async (id: string) => {
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Product not found',
            'No product found with the given id',
        );
    }
    return deleted;
};

// ── Toggle Featured ──────────────────────────────────────────────────────────
const toggleFeatured = async (id: string) => {
    const product = await Product.findById(id);
    if (!product) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Product not found',
            'No product found with the given id',
        );
    }
    product.isFeatured = !product.isFeatured;
    await product.save();
    return product;
};

// ── Update a Variant ─────────────────────────────────────────────────────────
const updateVariant = async (
    productId: string,
    variantId: string,
    payload: Record<string, unknown>,
) => {
    // Build a $set map that targets only the variant fields supplied
    const setFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
        setFields[`variants.$.${key}`] = value;
    }

    const product = await Product.findOneAndUpdate(
        {
            _id: productId,
            'variants._id': new mongoose.Types.ObjectId(variantId),
        },
        { $set: setFields },
        { new: true, runValidators: true },
    );

    if (!product) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Product or variant not found',
            '',
        );
    }
    return product;
};

// NOTE: the old addReviewRating() function that used to live here has been
// replaced by the dedicated `review` module (model.review.ts / service.review.ts).
// It had no ownership or delivery-status check — anyone could submit a rating
// for any order/variant ID and inflate a product's public rating. The new
// module verifies the requester owns a delivered order containing the item
// before accepting a review, and only counts it toward the product's rating
// once an admin approves it.

export const productServices = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    toggleFeatured,
    updateVariant,
};