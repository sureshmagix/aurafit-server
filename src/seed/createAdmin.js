require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user.model");

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const existingAdmin = await User.findOne({ email: "admin@aurafit.com" });

        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit(0);
        }

        const admin = await User.create({
            name: "Aurafit Admin",
            email: "admin@aurafit.com",
            phone: "9999999999",
            password: "Admin@123",
            role: "admin",
        });

        console.log("Admin created successfully");
        console.log({
            email: admin.email,
            password: "Admin@123",
            role: admin.role,
        });

        process.exit(0);
    } catch (error) {
        console.error("Failed to create admin:", error.message);
        process.exit(1);
    }
};

createAdmin();