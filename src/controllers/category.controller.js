const Category = require("../models/category.model");
const Product = require("../models/product.model");
const asyncHandler = require("../utils/asyncHandler");
const isValidObjectId = require("../utils/isValidObjectId");

// @desc    Create category
// @route   POST /api/categories
// @access  Public (admin later)
const createCategory = asyncHandler(async (req, res) => {
    const { name, slug, description, image, isActive } = req.body;

    if (!name || !slug) {
        return res.status(400).json({
            success: false,
            message: "Name and slug are required",
        });
    }

    const existingCategory = await Category.findOne({
        $or: [{ name: name.trim() }, { slug: slug.trim().toLowerCase() }],
    });

    if (existingCategory) {
        return res.status(400).json({
            success: false,
            message: "Category with same name or slug already exists",
        });
    }

    const category = await Category.create({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim() || "",
        image: image || "",
        isActive: typeof isActive === "boolean" ? isActive : true,
    });

    res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
    });
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const { active } = req.query;

    const filter = {};

    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;

    const categories = await Category.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
    });
});

// @desc    Get category by id
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid category id",
        });
    }

    const category = await Category.findById(id);

    if (!category) {
        return res.status(404).json({
            success: false,
            message: "Category not found",
        });
    }

    res.status(200).json({
        success: true,
        data: category,
    });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Public (admin later)
const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, slug, description, image, isActive } = req.body;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid category id",
        });
    }

    const category = await Category.findById(id);

    if (!category) {
        return res.status(404).json({
            success: false,
            message: "Category not found",
        });
    }

    if (name) {
        const existingByName = await Category.findOne({
            name: name.trim(),
            _id: { $ne: id },
        });

        if (existingByName) {
            return res.status(400).json({
                success: false,
                message: "Another category with this name already exists",
            });
        }

        category.name = name.trim();
    }

    if (slug) {
        const existingBySlug = await Category.findOne({
            slug: slug.trim().toLowerCase(),
            _id: { $ne: id },
        });

        if (existingBySlug) {
            return res.status(400).json({
                success: false,
                message: "Another category with this slug already exists",
            });
        }

        category.slug = slug.trim().toLowerCase();
    }

    if (description !== undefined) category.description = description.trim();
    if (image !== undefined) category.image = image;
    if (typeof isActive === "boolean") category.isActive = isActive;

    const updatedCategory = await category.save();

    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: updatedCategory,
    });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Public (admin later)
const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid category id",
        });
    }

    const category = await Category.findById(id);

    if (!category) {
        return res.status(404).json({
            success: false,
            message: "Category not found",
        });
    }

    const linkedProductsCount = await Product.countDocuments({ category: id });

    if (linkedProductsCount > 0) {
        return res.status(400).json({
            success: false,
            message: "Cannot delete category because products are linked to it",
            linkedProductsCount,
        });
    }

    await category.deleteOne();

    res.status(200).json({
        success: true,
        message: "Category deleted successfully",
    });
});

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};