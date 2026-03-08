const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const asyncHandler = require("../utils/asyncHandler");
const isValidObjectId = require("../utils/isValidObjectId");
const { calculateCartTotals, getEffectivePrice } = require("../utils/cartHelpers");

// @desc    Get logged-in user's cart
// @route   GET /api/cart
// @access  Private
const getMyCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
        "items.product",
        "name slug images isActive sizes colors"
    );

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            items: [],
            totalItems: 0,
            subtotal: 0,
        });
    }

    res.status(200).json({
        success: true,
        data: cart,
    });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity = 1, selectedSize = "", selectedColor = "" } = req.body;

    if (!productId) {
        return res.status(400).json({
            success: false,
            message: "productId is required",
        });
    }

    if (!isValidObjectId(productId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid product id",
        });
    }

    if (Number(quantity) < 1) {
        return res.status(400).json({
            success: false,
            message: "Quantity must be at least 1",
        });
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
        return res.status(404).json({
            success: false,
            message: "Product not found or inactive",
        });
    }

    if (selectedSize) {
        const sizeEntry = product.sizes.find((item) => item.size === selectedSize);

        if (!sizeEntry) {
            return res.status(400).json({
                success: false,
                message: "Selected size is not available for this product",
            });
        }

        if (sizeEntry.stock < Number(quantity)) {
            return res.status(400).json({
                success: false,
                message: `Only ${sizeEntry.stock} items available for size ${selectedSize}`,
            });
        }
    }

    if (selectedColor) {
        const colorExists = product.colors.find((item) => item.name === selectedColor);

        if (!colorExists) {
            return res.status(400).json({
                success: false,
                message: "Selected color is not available for this product",
            });
        }
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            items: [],
            totalItems: 0,
            subtotal: 0,
        });
    }

    const effectivePrice = getEffectivePrice(product);

    const existingItemIndex = cart.items.findIndex(
        (item) =>
            item.product.toString() === productId &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
    );

    if (existingItemIndex > -1) {
        const newQuantity = cart.items[existingItemIndex].quantity + Number(quantity);

        if (selectedSize) {
            const sizeEntry = product.sizes.find((item) => item.size === selectedSize);
            if (sizeEntry && newQuantity > sizeEntry.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${sizeEntry.stock} items available for size ${selectedSize}`,
                });
            }
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].lineTotal = effectivePrice * newQuantity;
    } else {
        cart.items.push({
            product: product._id,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0] || "",
            price: product.price,
            discountPrice: product.discountPrice || 0,
            selectedSize,
            selectedColor,
            quantity: Number(quantity),
            lineTotal: effectivePrice * Number(quantity),
        });
    }

    const totals = calculateCartTotals(cart.items);
    cart.totalItems = totals.totalItems;
    cart.subtotal = totals.subtotal;

    await cart.save();

    const populatedCart = await Cart.findOne({ user: req.user._id }).populate(
        "items.product",
        "name slug images isActive sizes colors"
    );

    res.status(200).json({
        success: true,
        message: "Item added to cart successfully",
        data: populatedCart,
    });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || Number(quantity) < 1) {
        return res.status(400).json({
            success: false,
            message: "Valid quantity is required",
        });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return res.status(404).json({
            success: false,
            message: "Cart not found",
        });
    }

    const item = cart.items.id(itemId);

    if (!item) {
        return res.status(404).json({
            success: false,
            message: "Cart item not found",
        });
    }

    const product = await Product.findById(item.product);

    if (!product || !product.isActive) {
        return res.status(404).json({
            success: false,
            message: "Product not found or inactive",
        });
    }

    if (item.selectedSize) {
        const sizeEntry = product.sizes.find((size) => size.size === item.selectedSize);

        if (!sizeEntry) {
            return res.status(400).json({
                success: false,
                message: `Size ${item.selectedSize} is no longer available`,
            });
        }

        if (Number(quantity) > sizeEntry.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${sizeEntry.stock} items available for size ${item.selectedSize}`,
            });
        }
    }

    const effectivePrice = getEffectivePrice(product);

    item.quantity = Number(quantity);
    item.price = product.price;
    item.discountPrice = product.discountPrice || 0;
    item.lineTotal = effectivePrice * Number(quantity);

    const totals = calculateCartTotals(cart.items);
    cart.totalItems = totals.totalItems;
    cart.subtotal = totals.subtotal;

    await cart.save();

    const populatedCart = await Cart.findOne({ user: req.user._id }).populate(
        "items.product",
        "name slug images isActive sizes colors"
    );

    res.status(200).json({
        success: true,
        message: "Cart item updated successfully",
        data: populatedCart,
    });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeCartItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return res.status(404).json({
            success: false,
            message: "Cart not found",
        });
    }

    const item = cart.items.id(itemId);

    if (!item) {
        return res.status(404).json({
            success: false,
            message: "Cart item not found",
        });
    }

    item.deleteOne();

    const totals = calculateCartTotals(cart.items);
    cart.totalItems = totals.totalItems;
    cart.subtotal = totals.subtotal;

    await cart.save();

    const populatedCart = await Cart.findOne({ user: req.user._id }).populate(
        "items.product",
        "name slug images isActive sizes colors"
    );

    res.status(200).json({
        success: true,
        message: "Cart item removed successfully",
        data: populatedCart,
    });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            items: [],
            totalItems: 0,
            subtotal: 0,
        });
    } else {
        cart.items = [];
        cart.totalItems = 0;
        cart.subtotal = 0;
        await cart.save();
    }

    res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
        data: cart,
    });
});

module.exports = {
    getMyCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
};