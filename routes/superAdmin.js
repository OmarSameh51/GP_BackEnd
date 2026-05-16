const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const superAdminOnly = require("../middleware/superAdminMiddleware");

const {
  createAdmin,
  getAllAdmins,
  deleteAdmin,
  editAdmin,
} = require("../controllers/superAdminController");

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
/**
 * @swagger
 * /super-admin/admins:
 *   get:
 *     summary: Get all admins
 *     description: Allows super admin to retrieve all admins and super admins.
 *     tags:
 *       - Super Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admins retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super admin only
 *       500:
 *         description: Server error
 */
router.get("/admins", protect, superAdminOnly, getAllAdmins);
/**
 * @swagger
 * /super-admin/admin/{username}:
 *   delete:
 *     summary: Delete admin by username
 *     description: Allows super admin to delete an admin account.
 *     tags:
 *       - Super Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         example: stitch_admin
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       400:
 *         description: Cannot delete yourself
 *       403:
 *         description: Cannot delete super admin
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.delete("/admin/:username", protect, superAdminOnly, deleteAdmin);
/**
 * @swagger
 * /super-admin/admin/{username}:
 *   put:
 *     summary: Edit admin
 *     description: Allows super admin to update admin username or phone number.
 *     tags:
 *       - Super Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         example: stitch_admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: new_admin_name
 *               phoneNumber:
 *                 type: string
 *                 example: "01012345678"
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       400:
 *         description: Invalid request or duplicate username
 *       403:
 *         description: Cannot edit super admin
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.put("/admin/:username", protect, superAdminOnly, editAdmin);
module.exports = router;
