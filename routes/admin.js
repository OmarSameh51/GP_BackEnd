const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  getAllStudents,
  getStudentById,
  deleteStudent,
  updateCourseProperties,
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
/**
 * @swagger
 * /admin/course/{courseCode}:
 *   patch:
 *     summary: Update course properties
 *     description: Allows admin to update one or more properties of a course. At least one field must be provided.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "CS112"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               Required_level:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *                 example: 2
 *               Required_Hours:
 *                 type: number
 *                 minimum: 0
 *                 example: 120
 *               Semester:
 *                 type: integer
 *                 enum: [1, 2]
 *                 example: 1
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Validation error or no fields provided
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.patch("/course/:courseCode", protect, adminOnly, updateCourseProperties);
module.exports = router;
