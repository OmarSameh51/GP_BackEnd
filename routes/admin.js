const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  getAllStudents,
  getStudentById,
  deleteStudent,
  updateCourseProperties,
  getAllCourses,
  getCourseByCode,
  getCourseRelations,
  addPrerequisite,
  removePrerequisite,
  getActiveCourses,
  addCourse,
  getUnlockedCourses,
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
 * /admin/courses/active:
 *   get:
 *     summary: Get all active courses
 *     description: Returns all active courses only.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active courses retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       500:
 *         description: Server error
 */
router.get("/courses/active", protect, adminOnly, getActiveCourses);
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
/**
 * @swagger
 * /admin/courses:
 *   get:
 *     summary: Get all courses
 *     description: Returns a list of all courses ordered by course code.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all courses retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       500:
 *         description: Server error
 */
router.get("/courses", protect, adminOnly, getAllCourses);
/**
 * @swagger
 * /admin/course/{courseCode}:
 *   get:
 *     summary: Get course by code
 *     description: Returns a single course by its unique course code.
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
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/course/:courseCode", protect, adminOnly, getCourseByCode);
/**
 * @swagger
 * /admin/course/{courseCode}/relations:
 *   get:
 *     summary: Get course relations
 *     description: Returns the prerequisites (courses that must be taken before) and the courses that this course unlocks.
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
 *     responses:
 *       200:
 *         description: Course relations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get(
  "/course/:courseCode/relations",
  protect,
  adminOnly,
  getCourseRelations,
);
/**
 * @swagger
 * /admin/course/{courseCode}/prerequisite:
 *   post:
 *     summary: Add a prerequisite to a course
 *     description: Creates a Requires and Unlocks relationship between two courses. A course cannot require itself.
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
 *         example: "CS201"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prerequisiteCode
 *             properties:
 *               prerequisiteCode:
 *                 type: string
 *                 example: "CS112"
 *     responses:
 *       200:
 *         description: Prerequisite added successfully
 *       400:
 *         description: prerequisiteCode is required or course cannot require itself
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Course or prerequisite not found
 *       500:
 *         description: Server error
 */
router.post(
  "/course/:courseCode/prerequisite",
  protect,
  adminOnly,
  addPrerequisite,
);
/**
 * @swagger
 * /admin/course/{courseCode}/prerequisite/{prerequisiteCode}:
 *   delete:
 *     summary: Remove a prerequisite from a course
 *     description: Deletes the Requires relationship (and Unlocks if exists) between two courses.
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
 *         example: "CS201"
 *       - in: path
 *         name: prerequisiteCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "CS112"
 *     responses:
 *       200:
 *         description: Prerequisite removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Relationship not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/course/:courseCode/prerequisite/:prerequisiteCode",
  protect,
  adminOnly,
  removePrerequisite,
);
/**
 * @swagger
 * /admin/course:
 *   post:
 *     summary: Add a new course
 *     description: Creates a new course node in the database. All fields are required.
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
 *               - Code
 *               - name
 *               - Credits
 *               - Semester
 *               - Required_level
 *               - Required_Hours
 *               - isActive
 *             properties:
 *               Code:
 *                 type: string
 *                 example: "CS201"
 *               name:
 *                 type: string
 *                 example: "Data Structures"
 *               Credits:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *               Semester:
 *                 type: integer
 *                 enum: [1, 2]
 *                 example: 1
 *               Required_level:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *                 example: 2
 *               Required_Hours:
 *                 type: integer
 *                 minimum: 0
 *                 example: 90
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Course added successfully
 *       400:
 *         description: Validation error — one of the required fields is missing or invalid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       409:
 *         description: Course already exists
 *       500:
 *         description: Server error
 */
router.post("/course", protect, adminOnly, addCourse);
/**
 * @swagger
 * /admin/course/{courseCode}/unlocks:
 *   get:
 *     summary: Get courses unlocked by a course
 *     description: Returns all courses that require the given course as a prerequisite (i.e. courses that become available after completing it).
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
 *     responses:
 *       200:
 *         description: Unlocked courses retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get(
  "/course/:courseCode/unlocks",
  protect,
  adminOnly,
  getUnlockedCourses,
);
module.exports = router;
