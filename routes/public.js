const express = require("express");
const router = express.Router();

const {
  getActiveCourses,
  searchCourses,
  getCourseByCode,
  getCourseRelations,
  getUnlockedCourses,
  getAcademicAdvice,
  getAcademicRoadmap,
  getAnnouncements,
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
 * /public/courses/search:
 *   get:
 *     summary: Search active courses by code or name (guest)
 *     description: Public read-only endpoint. Returns active courses whose code or name contains the query string (case-insensitive). Used to power course-picker autocomplete UIs. No authentication required.
 *     tags:
 *       - Public
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         example: "program"
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *         example: 20
 *     responses:
 *       200:
 *         description: Matching courses retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/courses/search", searchCourses);

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

/**
 * @swagger
 * /public/ai/roadmap:
 *   post:
 *     summary: Get a semester-by-semester roadmap to graduation (guest)
 *     description: Public endpoint. Accepts the same body as /public/ai/advise (department, academicYear, optional preferredDepartment, optional semester the plan starts from, passedCourses). The AI service simulates every remaining semester until the department's required hours are covered — prerequisites unlock term by term, semester offerings and credit caps are respected. Nothing is persisted.
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
 *               academicYear:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *               preferredDepartment:
 *                 type: string
 *                 enum: [AI, CS, IT, IS, General]
 *               semester:
 *                 type: integer
 *                 enum: [1, 2]
 *               passedCourses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     courseCode: { type: string }
 *                     grade: { type: number }
 *                     isPassed: { type: boolean }
 *     responses:
 *       200:
 *         description: Roadmap generated
 *       400:
 *         description: Validation error
 *       502:
 *         description: AI advisor unavailable
 */
router.post("/ai/roadmap", getAcademicRoadmap);

/**
 * @swagger
 * /public/announcements:
 *   get:
 *     summary: Get recent course update announcements
 *     description: Public read-only endpoint. Returns the most recent course change announcements (course created, course properties updated, prerequisite added/removed) recorded by admins, newest first. Supports ?limit (max 100, default 20) and ?offset (default 0).
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema: { type: integer, minimum: 0, default: 0 }
 *         example: 0
 *     responses:
 *       200:
 *         description: Announcements retrieved successfully
 *       500: { description: Server error }
 */
router.get("/announcements", getAnnouncements);

module.exports = router;
