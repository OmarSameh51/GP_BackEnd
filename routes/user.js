const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { getProfile, addCourse } = require("../controllers/userController");

router.post("/course", protect, addCourse);

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "60d0fe4f5311236168a109ca"
 *                 studentId:
 *                   type: string
 *                   example: "STU-2026-ABC123D4"
 *                 firstName:
 *                   type: string
 *                   example: "Ahmed"
 *                 lastName:
 *                   type: string
 *                   example: "Hassan"
 *                 username:
 *                   type: string
 *                   example: "ahmed.hassan"
 *                 email:
 *                   type: string
 *                   example: "ahmed@example.com"
 *                 academicYear:
 *                   type: number
 *                   example: 3
 *                 department:
 *                   type: string
 *                   example: "Computer Science"
 *                 gpa:
 *                   type: number
 *                   example: 3.7
 *                 totalCreditHours:
 *                   type: number
 *                   example: 90
 *                 enrolledCourses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       courseCode:
 *                         type: string
 *                         example: "CS301"
 *                       courseName:
 *                         type: string
 *                         example: "Data Structures"
 *                       creditHours:
 *                         type: number
 *                         example: 3
 *                       grade:
 *                         type: string
 *                         example: "A"
 *                       gradePoints:
 *                         type: number
 *                         example: 4.0
 *                       semester:
 *                         type: string
 *                         example: "Fall 2025"
 *                 AI_plan:
 *                   type: object
 *                   properties:
 *                     plan:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           courseCode:
 *                             type: string
 *                           courseName:
 *                             type: string
 *                           creditHours:
 *                             type: number
 *                 phoneNumber:
 *                   type: string
 *                   example: "+201012345678"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     msg:
 *                       type: string
 *                       example: "No token, access denied"
 *                 - type: object
 *                   properties:
 *                     msg:
 *                       type: string
 *                       example: "Not authorized"
 *                     error:
 *                       type: string
 */
router.get("/profile", protect, getProfile);

module.exports = router;
