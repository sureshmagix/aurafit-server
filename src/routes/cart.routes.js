const express = require("express");
const {
    getMyCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
} = require("../controllers/cart.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.route("/").get(getMyCart).post(addToCart).delete(clearCart);
router.route("/:itemId").put(updateCartItem).delete(removeCartItem);

module.exports = router;