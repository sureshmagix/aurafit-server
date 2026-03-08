const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const asyncHandler = require("../utils/asyncHandler");
const isValidObjectId = require("../utils/isValidObjectId");
const generateOrderNumber = require("../utils/generateOrderNumber");
const { getEffectivePrice } = require("../utils/cartHelpers");

// @desc    Place order from cart
// @route   POST /api/orders
// @access  Private
const placeOrder = asyncHandler(async (req, res) => {
    const {
        shippingAddress,
        paymentMethod = "COD",
        shippingCharge = 0,
        taxAmount = 0,
        discountAmount = 0,
        notes = "",
    } = req.body;

    if (!shippingAddress) {
        return res.status(400).json({
            success: false,
            message: "shippingAddress is required",
        });
    }

    const requiredAddressFields = [
        "fullName",
        "phone",
        "addressLine1",
        "city",
        "state",
        "postalCode",
    ];

    for (const field of requiredAddressFields) {
        if (!shippingAddress[field]) {
            return res.status(400).json({
                success: false,
                message: `shippingAddress.${field} is required`,
            });
        }
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || !cart.items.length) {
        return res.status(400).json({
            success: false,
            message: "Cart is empty",
        });
    }

    const orderItems = [];

    for (const item of cart.items) {
        const product = await Product.findById(item.product);

        if (!product || !product.isActive) {
            return res.status(400).json({
                success: false,
                message: `Product '${item.name}' is unavailable`,
            });
        }

        if (item.selectedSize) {
            const sizeEntry = product.sizes.find((size) => size.size === item.selectedSize);

            if (!sizeEntry) {
                return res.status(400).json({
                    success: false,
                    message: `Size ${item.selectedSize} is unavailable for product '${item.name}'`,
                });
            }

            if (sizeEntry.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${sizeEntry.stock} items available for '${item.name}' size '${item.selectedSize}'`,
                });
            }
        }

        const effectivePrice = getEffectivePrice(product);
        const lineTotal = effectivePrice * item.quantity;

        orderItems.push({
            product: product._id,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0] || "",
            price: product.price,
            discountPrice: product.discountPrice || 0,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            quantity: item.quantity,
            lineTotal,
        });
    }

    for (const item of orderItems) {
        if (item.selectedSize) {
            const product = await Product.findById(item.product);
            const sizeEntry = product.sizes.find((size) => size.size === item.selectedSize);

            if (sizeEntry) {
                sizeEntry.stock -= item.quantity;
                await product.save();
            }
        }
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalAmount =
        subtotal + Number(shippingCharge) + Number(taxAmount) - Number(discountAmount);

    const order = await Order.create({
        orderNumber: generateOrderNumber(),
        user: req.user._id,
        items: orderItems,
        shippingAddress: {
            fullName: shippingAddress.fullName.trim(),
            phone: shippingAddress.phone.trim(),
            addressLine1: shippingAddress.addressLine1.trim(),
            addressLine2: shippingAddress.addressLine2?.trim() || "",
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            postalCode: shippingAddress.postalCode.trim(),
            country: shippingAddress.country?.trim() || "India",
        },
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "Pending" : "Pending",
        orderStatus: "Placed",
        subtotal,
        shippingCharge: Number(shippingCharge) || 0,
        taxAmount: Number(taxAmount) || 0,
        discountAmount: Number(discountAmount) || 0,
        totalAmount,
        notes: notes?.trim() || "",
    });

    cart.items = [];
    cart.totalItems = 0;
    cart.subtotal = 0;
    await cart.save();

    const populatedOrder = await Order.findById(order._id)
        .populate("user", "name email phone")
        .populate("items.product", "name slug");

    res.status(201).json({
        success: true,
        message: "Order placed successfully",
        data: populatedOrder,
    });
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
        .populate("items.product", "name slug")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
    });
});

// @desc    Get single order by id for logged-in user
// @route   GET /api/orders/:id
// @access  Private
const getMyOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order id",
        });
    }

    const order = await Order.findOne({
        _id: id,
        user: req.user._id,
    })
        .populate("user", "name email phone")
        .populate("items.product", "name slug");

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found",
        });
    }

    res.status(200).json({
        success: true,
        data: order,
    });
});

// @desc    Get all orders
// @route   GET /api/orders/admin/all
// @access  Admin
const getAllOrders = asyncHandler(async (req, res) => {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
        .populate("user", "name email phone role")
        .populate("items.product", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    res.status(200).json({
        success: true,
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        data: orders,
    });
});

// @desc    Update order status
// @route   PUT /api/orders/admin/:id/status
// @access  Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order id",
        });
    }

    const order = await Order.findById(id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found",
        });
    }

    const validOrderStatuses = [
        "Placed",
        "Confirmed",
        "Packed",
        "Shipped",
        "Delivered",
        "Cancelled",
    ];

    const validPaymentStatuses = ["Pending", "Paid", "Failed", "Refunded"];

    if (orderStatus) {
        if (!validOrderStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid orderStatus value",
            });
        }

        order.orderStatus = orderStatus;

        if (orderStatus === "Delivered") {
            order.deliveredAt = new Date();
        }

        if (orderStatus === "Cancelled") {
            order.cancelledAt = new Date();

            for (const item of order.items) {
                if (item.selectedSize) {
                    const product = await Product.findById(item.product);
                    if (product) {
                        const sizeEntry = product.sizes.find(
                            (size) => size.size === item.selectedSize
                        );
                        if (sizeEntry) {
                            sizeEntry.stock += item.quantity;
                            await product.save();
                        }
                    }
                }
            }
        }
    }

    if (paymentStatus) {
        if (!validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paymentStatus value",
            });
        }

        order.paymentStatus = paymentStatus;
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
        .populate("user", "name email phone")
        .populate("items.product", "name slug");

    res.status(200).json({
        success: true,
        message: "Order updated successfully",
        data: updatedOrder,
    });
});

module.exports = {
    placeOrder,
    getMyOrders,
    getMyOrderById,
    getAllOrders,
    updateOrderStatus,
};