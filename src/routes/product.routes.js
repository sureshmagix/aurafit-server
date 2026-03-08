const express = require("express");
const {
    createProduct,
    getProducts,
    getProductBySlug,
} = require("../controllers/product.controller");

const router = express.Router();

router.post("/", createProduct);
router.get("/", getProducts);
router.get("/:slug", getProductBySlug);

module.exports = router;