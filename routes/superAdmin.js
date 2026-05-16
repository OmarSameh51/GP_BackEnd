const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const superAdminOnly = require("../middleware/superAdminMiddleware");

const { createAdmin } = require("../controllers/superAdminController");

/**
 * @swagger
 * /super-admin/create-admin:
 *   post:
 *     summary: Create a new admin (Super Admin only)
 *     description: Allows only super admins to create new admins.
 *     tags:
 *       - Super Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - username
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Omar
 *               lastName:
 *                 type: string
 *                 example: Sameh
 *               username:
 *                 type: string
 *                 example: stitch_admin
 *               email:
 *                 type: string
 *                 example: admin@test.com
 *               password:
 *                 type: string
 *                 example: admin123
 *               phoneNumber:
 *                 type: string
 *                 example: "01000000000"
 *               role:
 *                 type: string
 *                 enum: [admin]
 *                 example: admin
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super admin only
 *       500:
 *         description: Server error
 */
router.post("/create-admin", protect, superAdminOnly, createAdmin);

module.exports = router;
