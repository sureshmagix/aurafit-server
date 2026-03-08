const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const isValidObjectId = require("../utils/isValidObjectId");

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: users.length,
        data: users,
    });
});

// @desc    Get single user by id
// @route   GET /api/users/:id
// @access  Admin
const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user id",
        });
    }

    const user = await User.findById(id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Admin
const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user id",
        });
    }

    if (!role || !["customer", "admin"].includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Valid role is required: customer or admin",
        });
    }

    const user = await User.findById(id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
        success: true,
        message: "User role updated successfully",
        data: user,
    });
});

// @desc    Update user active status
// @route   PUT /api/users/:id/status
// @access  Admin
const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user id",
        });
    }

    if (typeof isActive !== "boolean") {
        return res.status(400).json({
            success: false,
            message: "isActive must be true or false",
        });
    }

    const user = await User.findById(id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
        success: true,
        message: "User status updated successfully",
        data: user,
    });
});

module.exports = {
    getAllUsers,
    getUserById,
    updateUserRole,
    updateUserStatus,
};