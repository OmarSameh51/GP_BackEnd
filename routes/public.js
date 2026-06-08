const express = require("express");
const router = express.Router();

const {
  getActiveCourses,
  getCourseByCode,
  getCourseRelations,
  getUnlockedCourses,
  getAcademicAdvice,
} = require("../controllers/publicController");

/**
 * @swagger
 * /public/courses:
 *   get:
 *     summary: Get all active courses (guest)
 *     description: Public read-only endpoint. Returns every active course in the catalog. No authentication required.
 *     tags:
 *       - Public
 *     responses:
 *       200:
 *         description: Active courses retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/courses", getActiveCourses);

/**
 * @swagger
 * /public/course/{courseCode}:
 *   get:
 *     summary: Get a single active course (guest)
 *     description: Public read-only endpoint. Returns one active course by its code. No authentication required.
 *     tags:
 *       - Public
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
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/course/:courseCode", getCourseByCode);

/**
 * @swagger
 * /public/course/{courseCode}/relations:
 *   get:
 *     summary: Get course prerequisites and unlocks (guest)
 *     description: Public read-only endpoint. Returns the active prerequisite courses and the active courses that this course unlocks. No authentication required.
 *     tags:
 *       - Public
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
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/course/:courseCode/relations", getCourseRelations);

/**
 * @swagger
 * /public/course/{courseCode}/unlocks:
 *   get:
 *     summary: Get courses unlocked by a course (guest)
 *     description: Public read-only endpoint. Returns all active courses that require the given course as a prerequisite. No authentication required.
 *     tags:
 *       - Public
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
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/course/:courseCode/unlocks", getUnlockedCourses);

/**
 * @swagger
 * /public/ai/advise:
 *   post:
 *     summary: Get academic advice (guest)
 *     description: Public read-only endpoint. Accepts a guest-supplied department, academic year, optional preferred department, and a list of courses the guest claims to have passed. Creates a temporary Guest node in Neo4j, validates the input against the course graph, computes which active courses are available now vs. which need additional prerequisites, then deletes the Guest node. No data is persisted beyond the lifetime of the request (a periodic cleanup job removes any orphans).
 *     tags:
 *       - Public
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - department
 *               - academicYear
 *             properties:
 *               department:
 *                 type: string
 *                 enum: [AI, CS, IT, IS, General]
 *                 example: "CS"
 *               academicYear:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *                 example: 2
 *               preferredDepartment:
 *                 type: string
 *                 enum: [AI, CS, IT, IS, General]
 *                 example: "AI"
 *               passedCourses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - courseCode
 *                   properties:
 *                     courseCode:
 *                       type: string
 *                       example: "CS112"
 *                     grade:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 85
 *                     isPassed:
 *                       type: boolean
 *                       example: true
 *     responses:
 *       200:
 *         description: Advice retrieved successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/ai/advise", getAcademicAdvice);

module.exports = router;
