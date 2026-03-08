const Product = require("../models/product.model");

// Create product
const createProduct = async (req, res) => {
    try {
        const existingProduct = await Product.findOne({ slug: req.body.slug });

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: "Product with this slug already exists",
            });
        }

        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: error.message,
        });
    }
};

// Get all products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate("category", "name slug")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message,
        });
    }
};

// Get single product by slug
const getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug }).populate(
            "category",
            "name slug"
        );

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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch product",
            error: error.message,
        });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductBySlug,
};