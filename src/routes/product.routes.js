const express = require("express");
const {
    createProduct,
    getProducts,
    getProductBySlug,
    getProductById,
    updateProduct,
    deleteProduct,
} = require("../controllers/product.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router
    .route("/")
    .post(protect, authorize("admin"), createProduct)
    .get(getProducts);

router.get("/slug/:slug", getProductBySlug);

router
    .route("/:id")
    .get(getProductById)
    .put(protect, authorize("admin"), updateProduct)
    .delete(protect, authorize("admin"), deleteProduct);

module.exports = router;