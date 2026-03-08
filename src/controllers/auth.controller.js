const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, email and password are required",
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters",
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "User already exists with this email",
        });
    }

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || "",
        password,
        role: "customer",
    });

    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
        },
    });
});

// @desc    Login user/admin
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required",
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
        });
    }

    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: "Your account is inactive. Contact admin",
        });
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
        });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        },
    });
});

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user,
    });
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
};