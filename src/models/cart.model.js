const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        image: {
            type: String,
            default: "",
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        discountPrice: {
            type: Number,
            default: 0,
            min: 0,
        },
        selectedSize: {
            type: String,
            trim: true,
            default: "",
        },
        selectedColor: {
            type: String,
            trim: true,
            default: "",
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        lineTotal: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
    },
    { timestamps: true }
);

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        items: {
            type: [cartItemSchema],
            default: [],
        },
        totalItems: {
            type: Number,
            default: 0,
            min: 0,
        },
        subtotal: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

cartSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);