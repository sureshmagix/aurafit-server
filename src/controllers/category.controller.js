const Category = require("../models/category.model");

// Create category
const createCategory = async (req, res) => {
    try {
        const { name, slug, description, image, isActive } = req.body;

        const existingCategory = await Category.findOne({
            $or: [{ name }, { slug }],
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category with same name or slug already exists",
            });
        }

        const category = await Category.create({
            name,
            slug,
            description,
            image,
            isActive,
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create category",
            error: error.message,
        });
    }
};

// Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
            error: error.message,
        });
    }
};

module.exports = {
    createCategory,
    getCategories,
};