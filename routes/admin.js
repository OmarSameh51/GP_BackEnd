const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  createAdmin,
  getAllStudents,
} = require("../controllers/adminController");
const superAdminOnly = require("../middleware/superAdminMiddleware");

// create admin (super admin only)
/**
 * @swagger
 * /admin/create-admin:
 *   post:
 *     summary: Create a new admin (Super Admin only)
 *     description: Allows only super admins to create new admins.
 *     tags:
 *       - Admin
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
 *       400:
 *         description: Validation error or user already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super admin only
 *       500:
 *         description: Server error
 */
router.post("/create-admin", protect, superAdminOnly, createAdmin);
/**
 * @swagger
 * /admin/students:
 *   get:
 *     summary: Get all students
 *     description: Allows admin and super admin to retrieve all students.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       500:
 *         description: Server error
 */
router.get("/students", protect, adminOnly, getAllStudents);
module.exports = router;
