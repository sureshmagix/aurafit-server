const express = require("express");
const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} = require("../controllers/category.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router
    .route("/")
    .post(protect, authorize("admin"), createCategory)
    .get(getCategories);

router
    .route("/:id")
    .get(getCategoryById)
    .put(protect, authorize("admin"), updateCategory)
    .delete(protect, authorize("admin"), deleteCategory);

module.exports = router;