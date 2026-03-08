const mongoose = require("mongoose");

const sizeStockSchema = new mongoose.Schema(
    {
        size: {
            type: String,
            required: true,
            trim: true,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
    },
    { _id: false }
);

const colorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        hex: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },
        slug: {
            type: String,
            required: [true, "Product slug is required"],
            trim: true,
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true,
        },
        brand: {
            type: String,
            default: "Aurafit",
            trim: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        subCategory: {
            type: String,
            default: "",
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        discountPrice: {
            type: Number,
            min: 0,
            default: 0,
        },
        colors: {
            type: [colorSchema],
            default: [],
        },
        sizes: {
            type: [sizeStockSchema],
            default: [],
        },
        images: {
            type: [String],
            default: [],
        },
        tags: {
            type: [String],
            default: [],
        },
        fabric: {
            type: String,
            default: "",
            trim: true,
        },
        fit: {
            type: String,
            default: "",
            trim: true,
        },
        gender: {
            type: String,
            enum: ["Men", "Women", "Kids", "Unisex"],
            default: "Unisex",
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isNewArrival: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        reviewCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Product", productSchema);