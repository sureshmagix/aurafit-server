const Product = require("../models/product.model");
const Category = require("../models/category.model");
const asyncHandler = require("../utils/asyncHandler");
const isValidObjectId = require("../utils/isValidObjectId");

// @desc    Create product
// @route   POST /api/products
// @access  Public (admin later)
const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        slug,
        description,
        category,
        price,
        discountPrice,
        brand,
        subCategory,
        colors,
        sizes,
        images,
        tags,
        fabric,
        fit,
        gender,
        isFeatured,
        isNewArrival,
        isActive,
    } = req.body;

    if (!name || !slug || !description || !category || price === undefined) {
        return res.status(400).json({
            success: false,
            message: "name, slug, description, category and price are required",
        });
    }

    if (!isValidObjectId(category)) {
        return res.status(400).json({
            success: false,
            message: "Invalid category id",
        });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
        return res.status(404).json({
            success: false,
            message: "Category not found",
        });
    }

    const existingProduct = await Product.findOne({
        slug: slug.trim().toLowerCase(),
    });

    if (existingProduct) {
        return res.status(400).json({
            success: false,
            message: "Product with this slug already exists",
        });
    }

    const product = await Product.create({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        category,
        price,
        discountPrice: discountPrice || 0,
        brand: brand?.trim() || "Aurafit",
        subCategory: subCategory?.trim() || "",
        colors: Array.isArray(colors) ? colors : [],
        sizes: Array.isArray(sizes) ? sizes : [],
        images: Array.isArray(images) ? images : [],
        tags: Array.isArray(tags) ? tags : [],
        fabric: fabric?.trim() || "",
        fit: fit?.trim() || "",
        gender: gender || "Unisex",
        isFeatured: Boolean(isFeatured),
        isNewArrival: Boolean(isNewArrival),
        isActive: typeof isActive === "boolean" ? isActive : true,
    });

    const populatedProduct = await Product.findById(product._id).populate(
        "category",
        "name slug"
    );

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: populatedProduct,
    });
});

// @desc    Get all products with filters/search/pagination
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 12,
        search,
        category,
        gender,
        subCategory,
        minPrice,
        maxPrice,
        isFeatured,
        isNewArrival,
        isActive,
        sort = "newest",
    } = req.query;

    const filter = {};

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { slug: { $regex: search, $options: "i" } },
            { brand: { $regex: search, $options: "i" } },
            { subCategory: { $regex: search, $options: "i" } },
            { tags: { $elemMatch: { $regex: search, $options: "i" } } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    if (category) {
        if (isValidObjectId(category)) {
            filter.category = category;
        } else {
            const matchedCategory = await Category.findOne({
                slug: category.toLowerCase(),
            });

            if (matchedCategory) {
                filter.category = matchedCategory._id;
            } else {
                filter.category = null;
            }
        }
    }

    if (gender) filter.gender = gender;
    if (subCategory) filter.subCategory = { $regex: subCategory, $options: "i" };
    if (isFeatured === "true") filter.isFeatured = true;
    if (isFeatured === "false") filter.isFeatured = false;
    if (isNewArrival === "true") filter.isNewArrival = true;
    if (isNewArrival === "false") filter.isNewArrival = false;
    if (isActive === "true") filter.isActive = true;
    if (isActive === "false") filter.isActive = false;

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };

    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "name_asc") sortOption = { name: 1 };
    if (sort === "name_desc") sortOption = { name: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "newest") sortOption = { createdAt: -1 };

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
        .populate("category", "name slug")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber);

    res.status(200).json({
        success: true,
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        data: products,
    });
});

// @desc    Get single product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
    const product = await Product.findOne({
        slug: req.params.slug.toLowerCase(),
    }).populate("category", "name slug");

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found",
        });
    }

    res.status(200).json({
        success: true,
        data: product,
    });
});

// @desc    Get single product by id
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid product id",
        });
    }

    const product = await Product.findById(id).populate("category", "name slug");

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found",
        });
    }

    res.status(200).json({
        success: true,
        data: product,
    });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Public (admin later)
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid product id",
        });
    }

    const product = await Product.findById(id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found",
        });
    }

    if (req.body.slug) {
        const existingSlug = await Product.findOne({
            slug: req.body.slug.trim().toLowerCase(),
            _id: { $ne: id },
        });

        if (existingSlug) {
            return res.status(400).json({
                success: false,
                message: "Another product with this slug already exists",
            });
        }
    }

    if (req.body.category !== undefined) {
        if (!isValidObjectId(req.body.category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category id",
            });
        }

        const categoryExists = await Category.findById(req.body.category);
        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
    }

    const updateData = { ...req.body };

    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.slug) updateData.slug = updateData.slug.trim().toLowerCase();
    if (updateData.description) updateData.description = updateData.description.trim();
    if (updateData.brand) updateData.brand = updateData.brand.trim();
    if (updateData.subCategory) updateData.subCategory = updateData.subCategory.trim();
    if (updateData.fabric) updateData.fabric = updateData.fabric.trim();
    if (updateData.fit) updateData.fit = updateData.fit.trim();

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    }).populate("category", "name slug");

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
    });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Public (admin later)
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid product id",
        });
    }

    const product = await Product.findById(id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found",
        });
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
    });
});

module.exports = {
    createProduct,
    getProducts,
    getProductBySlug,
    getProductById,
    updateProduct,
    deleteProduct,
};