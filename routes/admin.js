const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  getAllStudents,
  getStudentById,
  deleteStudent,
} = require("../controllers/adminController");
const superAdminOnly = require("../middleware/superAdminMiddleware");

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
/**
 * @swagger
 * /admin/student/{studentId}:
 *   get:
 *     summary: Get student by ID
 *     description: Allows admin and super admin to retrieve a student's details by ID.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         example: "STU-2026-54AF9092"
 *     responses:
 *       200:
 *         description: Student retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.get("/student/:studentId", protect, adminOnly, getStudentById);
/**
 * @swagger
 * /admin/student/{studentId}:
 *   delete:
 *     summary: Delete student by ID
 *     description: Allows admin and super admin to delete a student account.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         example: "STU-2026-54AF9092"
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.delete("/student/:studentId", protect, adminOnly, deleteStudent);
module.exports = router;
