const Product = require("../models/product.model");
const Order = require("../models/order.model");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Suggest dresses/products based on AI mock algorithm
// @route   POST /api/match/suggest
// @access  Private
const suggestMatches = asyncHandler(async (req, res) => {
    const { occasion = "", style = "", preferredColors = [] } = req.body;
    
    // 1. Analyze user's purchase history to gain insight into their styling
    let pastOrders = [];
    if (req.user) {
        pastOrders = await Order.find({ user: req.user._id, orderStatus: { $ne: "Cancelled" } }).populate("items.product");
    }
    
    let boughtCategories = {};
    let boughtColors = {};
    
    pastOrders.forEach(order => {
        order.items.forEach(item => {
            if (item.product) {
                const p = item.product;
                if (p.category) {
                    boughtCategories[p.category] = (boughtCategories[p.category] || 0) + 1;
                }
                if (p.colors && p.colors.length > 0) {
                    p.colors.forEach(c => {
                        const colorName = c.name?.toLowerCase() || "";
                        boughtColors[colorName] = (boughtColors[colorName] || 0) + 1;
                    });
                }
            }
        });
    });

    // 2. Fetch all active products
    // We populate category to easily check its name if it's a ref. Wait, product schema uses ObjectId for category.
    // If we just want all products, we can fetch all or just those that match basic criteria.
    const allProducts = await Product.find({ isActive: true }).populate("category", "name slug");

    // 3. Smart Scoring Algorithm (Simulated AI)
    const scoredProducts = allProducts.map(product => {
        let score = 0;
        let reasons = [];

        const pName = product.name.toLowerCase();
        const pDesc = product.description.toLowerCase();
        const pTags = product.tags.map(t => t.toLowerCase());
        const categoryName = product.category?.name?.toLowerCase() || "";
        
        // Emphasize dresses if mentioned implicitly or explicitly
        if (categoryName.includes("dress") || pName.includes("dress") || pDesc.includes("dress")) {
            score += 10; 
        }

        // Match occasion
        const occasionTokens = occasion.toLowerCase().split(/[ ,]+/);
        let occasionMatched = false;
        occasionTokens.forEach(token => {
            if (token.length > 2) {
                if (pName.includes(token) || pDesc.includes(token) || pTags.includes(token)) {
                    score += 15;
                    occasionMatched = true;
                }
            }
        });
        if (occasionMatched) reasons.push(`Perfect for your ${occasion} occasion`);

        // Match style rules
        const styleTokens = style.toLowerCase().split(/[ ,]+/);
        let styleMatched = false;
        styleTokens.forEach(token => {
            if (token.length > 3) {
                if (pName.includes(token) || pDesc.includes(token) || pTags.includes(token) || (product.fit || "").toLowerCase().includes(token) || (product.fabric || "").toLowerCase().includes(token)) {
                    score += 10;
                    styleMatched = true;
                }
            }
        });
        if (styleMatched) reasons.push("Matches your preferred aesthetic");

        // Match colors
        let colorMatched = false;
        const pColors = product.colors.map(c => c.name.toLowerCase());
        
        preferredColors.forEach(color => {
            const lowerColor = color.toLowerCase();
            if (pColors.some(pc => pc.includes(lowerColor) || lowerColor.includes(pc)) || pName.includes(lowerColor)) {
                score += 20;
                colorMatched = true;
            }
        });

        if (colorMatched) reasons.push("Features your chosen color palette");

        // Influence from purchase history
        if (product.category && boughtCategories[product.category._id]) {
            score += boughtCategories[product.category._id] * 2;
            if (!reasons.includes("Similar to your past favorites")) {
                 reasons.push("Similar to your past favorites");
            }
        }

        pColors.forEach(c => {
            if (boughtColors[c]) {
                score += boughtColors[c] * 1.5;
            }
        });

        // Generate a friendly "AI" statement
        let matchReason = "";
        if (reasons.length > 0) {
            matchReason = "Selected by Aura Match: " + reasons.join(" and ") + "!";
        } else {
            matchReason = "Our algorithm thinks this looks great on you!";
        }

        return {
            ...product.toObject(),
            matchScore: score,
            matchReason
        };
    });

    // Sort by descending score
    scoredProducts.sort((a, b) => b.matchScore - a.matchScore);

    // Keep top 6 items
    const topMatches = scoredProducts.slice(0, 6).filter(p => p.matchScore > 0);

    // Fallback if no matching products (we'll just recommend top rated dresses/things)
    if (topMatches.length === 0) {
        const fallbacks = scoredProducts.sort((a, b) => b.rating - a.rating).slice(0, 4);
        return res.status(200).json({
            success: true,
            data: fallbacks.map(f => ({...f, matchReason: "A popular choice that elevates any look!"}))
        });
    }

    res.status(200).json({
        success: true,
        data: topMatches
    });
});

module.exports = {
    suggestMatches
};
