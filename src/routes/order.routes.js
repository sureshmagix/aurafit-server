const express = require("express");
const {
    placeOrder,
    getMyOrders,
    getMyOrderById,
    getAllOrders,
    updateOrderStatus,
} = require("../controllers/order.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.route("/").post(protect, placeOrder);
router.route("/my-orders").get(protect, getMyOrders);
router.route("/admin/all").get(protect, authorize("admin"), getAllOrders);
router.route("/admin/:id/status").put(protect, authorize("admin"), updateOrderStatus);
router.route("/:id").get(protect, getMyOrderById);

module.exports = router;
