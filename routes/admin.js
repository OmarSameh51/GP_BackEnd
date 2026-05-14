const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const { createAdmin } = require("../controllers/adminController");

// create admin (super admin only)
router.post("/create-admin", protect, adminOnly, createAdmin);

module.exports = router;
