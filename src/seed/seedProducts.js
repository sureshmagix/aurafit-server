const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Category = require("../models/category.model");

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB, starting seed...");

        // Define a "Dresses" category
        let dressCategory = await Category.findOne({ slug: "dresses" });
        if (!dressCategory) {
            dressCategory = await Category.create({
                name: "Dresses",
                slug: "dresses",
                description: "Elegant and casual dresses for all occasions.",
                image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80"
            });
            console.log("Created Dresses category");
        }

        let topsCategory = await Category.findOne({ slug: "tops" });
        if (!topsCategory) {
            topsCategory = await Category.create({
                name: "Tops",
                slug: "tops",
                description: "Stylish tops and blouses.",
                image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80"
            });
            console.log("Created Tops category");
        }

        // List of realistic products
        const productsToSeed = [
            {
                name: "Midnight Velvet Maxi Dress",
                slug: "midnight-velvet-maxi-dress",
                description: "A stunning floor-length velvet dress, perfect for formal events and elegant evening parties. The breathable yet luxurious fabric flatters every curve.",
                brand: "Aurafit Premium",
                category: dressCategory._id,
                price: 4500,
                discountPrice: 3999,
                colors: [{ name: "Black", hex: "#000000" }, { name: "Navy", hex: "#000080" }],
                sizes: [{ size: "S", stock: 10 }, { size: "M", stock: 15 }, { size: "L", stock: 5 }],
                images: ["https://images.unsplash.com/photo-1515347619362-e5fd41fbc8db?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80"],
                tags: ["formal", "evening", "party", "elegant", "velvet", "maxi", "dress"],
                fabric: "Premium Velvet",
                fit: "Slim Fit",
                gender: "Women",
                rating: 4.8,
                reviewCount: 34
            },
            {
                name: "Summer Breeze Floral Sundress",
                slug: "summer-breeze-floral-sundress",
                description: "Lightweight and flowy floral sundress, ideal for beach outings or casual weekend brunches in the sun.",
                brand: "Aurafit Bloom",
                category: dressCategory._id,
                price: 2100,
                colors: [{ name: "Yellow", hex: "#FFFF00" }, { name: "White", hex: "#FFFFFF" }, { name: "Pink", hex: "#FFC0CB" }],
                sizes: [{ size: "XS", stock: 8 }, { size: "S", stock: 20 }, { size: "M", stock: 10 }],
                images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=80"],
                tags: ["casual", "summer", "beach", "weekend", "floral", "sundress"],
                fabric: "Cotton Blend",
                fit: "Loose Fit",
                gender: "Women",
                rating: 4.5,
                reviewCount: 120
            },
            {
                name: "Scarlet Red Cocktail Dress",
                slug: "scarlet-red-cocktail-dress",
                description: "Make a statement with this vibrant red cocktail dress. Features a tailored fit, perfect for cocktail parties and date nights.",
                brand: "Aurafit Premium",
                category: dressCategory._id,
                price: 3200,
                colors: [{ name: "Red", hex: "#FF0000" }, { name: "Black", hex: "#000000" }],
                sizes: [{ size: "S", stock: 5 }, { size: "M", stock: 8 }],
                images: ["https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1000&q=80"],
                tags: ["party", "cocktail", "date", "vibrant", "red", "dress"],
                fabric: "Silk Blend",
                fit: "Tailored",
                gender: "Women",
                rating: 4.9,
                reviewCount: 45
            },
            {
                name: "Classic White Silk Blouse",
                slug: "classic-white-silk-blouse",
                description: "An elegant white silk blouse that transitions seamlessly from office hours to evening dinners.",
                brand: "Aurafit Workwear",
                category: topsCategory._id,
                price: 1800,
                colors: [{ name: "White", hex: "#FFFFFF" }, { name: "Beige", hex: "#F5F5DC" }],
                sizes: [{ size: "M", stock: 30 }, { size: "L", stock: 25 }],
                images: ["https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1000&q=80"],
                tags: ["office", "formal", "elegant", "silk", "white"],
                fabric: "Pure Silk",
                fit: "Classic Fit",
                gender: "Women",
                rating: 4.7,
                reviewCount: 88
            },
            {
                name: "Emerald Green Wrap Dress",
                slug: "emerald-green-wrap-dress",
                description: "A flattering wrap dress in rich emerald green. Perfect for versatile styling from daytime professional wear to casual dinners.",
                brand: "Aurafit Everyday",
                category: dressCategory._id,
                price: 2800,
                colors: [{ name: "Green", hex: "#008000" }],
                sizes: [{ size: "S", stock: 12 }, { size: "M", stock: 18 }, { size: "L", stock: 10 }, { size: "XL", stock: 6 }],
                images: ["https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=1000&q=80"],
                tags: ["professional", "wrap", "versatile", "green", "dress"],
                fabric: "Rayon Blend",
                fit: "Wrap/Adjustable",
                gender: "Women",
                rating: 4.6,
                reviewCount: 65
            }
        ];

        for (const pd of productsToSeed) {
            const existing = await Product.findOne({ slug: pd.slug });
            if (!existing) {
                await Product.create(pd);
                console.log("Created product:", pd.name);
            } else {
                console.log("Product already exists:", pd.name);
            }
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Failed to seed items:", error.message);
        process.exit(1);
    }
};

seedProducts();
