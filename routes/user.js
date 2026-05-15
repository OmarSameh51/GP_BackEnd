const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  getProfile,
  addCourse,
  editCourse,
  deleteCourse,
  updatePreferredDepartment,
} = require("../controllers/userController");
/**
 * @swagger
 * /user/course:
 *   post:
 *     summary: Add a course to authenticated student
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseCode
 *               - grade
 *             properties:
 *               courseCode:
 *                 type: string
 *                 example: "CS111"
 *               grade:
 *                 type: number
 *                 example: 85
 *     responses:
 *       200:
 *         description: Course added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Course added successfully"
 *                 course:
 *                   type: object
 *                   properties:
 *                     courseCode:
 *                       type: string
 *                       example: "CS111"
 *                     courseName:
 *                       type: string
 *                       example: "Introduction to Computer Science"
 *                     creditHours:
 *                       type: number
 *                       example: 3
 *                     grade:
 *                       type: number
 *                       example: 85
 *                     gradePoints:
 *                       type: number
 *                       example: 3.75
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.post("/course", protect, addCourse);
/**
 * @swagger
 * /user/course/{courseId}:
 *   put:
 *     summary: Edit a student's course grade
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         example: "6a04215d8ccbb846ffe27aa1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grade
 *             properties:
 *               grade:
 *                 type: number
 *                 example: 75
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Invalid grade
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.put("/course/:courseId", protect, editCourse);
/**
 * @swagger
 * /user/course/{courseId}:
 *   delete:
 *     summary: Delete a student's course
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         example: "6a04215d8ccbb846ffe27aa1"
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Course deleted successfully"
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/course/:courseId", protect, deleteCourse);
/**
 * @swagger
 * /user/preferred-department:
 *   put:
 *     summary: Update student's preferred department
 *     description: Allows authenticated students to update their preferred department. Only students can perform this action.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preferredDepartment
 *             properties:
 *               preferredDepartment:
 *                 type: string
 *                 enum: [AI, CS, IT, IS]
 *                 example: CS
 *     responses:
 *       200:
 *         description: Preferred department updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Preferred department updated successfully
 *                 preferredDepartment:
 *                   type: string
 *                   enum: [AI, CS, IT, IS]
 *                   example: CS
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *             examples:
 *               missingField:
 *                 summary: Missing preferred department
 *                 value:
 *                   msg: Preferred department is required
 *               invalidValue:
 *                 summary: Invalid department value
 *                 value:
 *                   msg: Invalid preferred department
 *       403:
 *         description: Forbidden – user is not a student
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Only students can set preferred department
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   example: Some unexpected error occurred
 */
router.put("/preferred-department", protect, updatePreferredDepartment);
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
