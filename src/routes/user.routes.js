const express = require("express");
const {
    getAllUsers,
    getUserById,
    updateUserRole,
    updateUserStatus,
} = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id/role", updateUserRole);
router.put("/:id/status", updateUserStatus);

module.exports = router;