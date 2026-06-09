const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  getProfile,
  addCourse,
  editCourse,
  deleteCourse,
  updatePreferredDepartment,
  updateDepartment,
  changePassword,
  getAnnouncements,
} = require("../controllers/userController");
/**
 * @swagger
 * /user/course:
 *   post:
 *     summary: Add a course to student record
 *     description: Adds a completed or failed course to the student's enrolled courses, recalculates GPA and total credit hours, and creates a TOOK relationship in Neo4j if the course was passed.
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
 *               - courseCode
 *               - grade
 *               - isPassed
 *             properties:
 *               courseCode:
 *                 type: string
 *                 example: "CS112"
 *               grade:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *               isPassed:
 *                 type: boolean
 *                 example: true
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
 *                   example: Course added successfully
 *                 course:
 *                   type: object
 *                   properties:
 *                     courseCode:
 *                       type: string
 *                       example: "CS112"
 *                     courseName:
 *                       type: string
 *                       example: "Programming Language 1"
 *                     creditHours:
 *                       type: number
 *                       example: 3
 *                     grade:
 *                       type: number
 *                       example: 85
 *                     isPassed:
 *                       type: boolean
 *                       example: true
 *                     gradePoints:
 *                       type: number
 *                       example: 3.7
 *       400:
 *         description: Validation error — one of the following
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 value: { msg: "Course code, grade and isPassed are required" }
 *               invalidIsPassed:
 *                 value: { msg: "isPassed must be true or false" }
 *               invalidGrade:
 *                 value: { msg: "Grade must be a number between 0 and 100" }
 *               alreadyPassed:
 *                 value: { msg: "You already passed this course" }
 *               failedTwice:
 *                 value: { msg: "You already failed this course once. Retake must be a passing grade" }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found or user not found
 *       500:
 *         description: Server error
 */
router.post("/course", protect, addCourse);
/**
 * @swagger
 * /user/course/{courseId}:
 *   patch:
 *     summary: Edit an enrolled course
 *     description: Updates the grade and isPassed status of an enrolled course. Recalculates GPA and total credit hours. Creates or deletes the TOOK relationship in Neo4j based on the pass/fail status change.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         example: "664f1e2b3c4d5e6f7a8b9c0d"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grade
 *               - isPassed
 *             properties:
 *               grade:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 90
 *               isPassed:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Course updated successfully
 *                 course:
 *                   type: object
 *                   properties:
 *                     courseCode:
 *                       type: string
 *                       example: "CS112"
 *                     courseName:
 *                       type: string
 *                       example: "Programming Language 1"
 *                     creditHours:
 *                       type: number
 *                       example: 3
 *                     grade:
 *                       type: number
 *                       example: 90
 *                     isPassed:
 *                       type: boolean
 *                       example: true
 *                     gradePoints:
 *                       type: number
 *                       example: 4.0
 *       400:
 *         description: Validation error — one of the following
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 value: { msg: "Grade and isPassed are required" }
 *               invalidIsPassed:
 *                 value: { msg: "isPassed must be true or false" }
 *               invalidGrade:
 *                 value: { msg: "Grade must be between 0 and 100" }
 *               alreadyPassed:
 *                 value: { msg: "You already passed this course" }
 *               oneFailed:
 *                 value: { msg: "Only one failed attempt is allowed for this course" }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found or course not found
 *       500:
 *         description: Server error
 */
router.patch("/course/:courseId", protect, editCourse);
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
 *   patch:
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
router.patch("/preferred-department", protect, updatePreferredDepartment);
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
/**
 * @swagger
 * /user/department:
 *   patch:
 *     summary: Update student department
 *     description: Allows a student to update their department. Only students can perform this action.
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
 *               - department
 *             properties:
 *               department:
 *                 type: string
 *                 enum: [AI, CS, IT, IS, General]
 *                 example: "CS"
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       400:
 *         description: Department is required or invalid department
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only students can update department
 *       500:
 *         description: Server error
 */
router.patch("/department", protect, updateDepartment);

/**
 * @swagger
 * /user/change-password:
 *   patch:
 *     summary: Change user password
 *     description: Allows an authenticated user to change their password by providing their current password and a new password.
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
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "oldPass123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "newPass123"
 *               confirmPassword:
 *                 type: string
 *                 example: "newPass123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error — one of the following
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 value: { msg: "All fields are required" }
 *               shortPassword:
 *                 value: { msg: "Password must be at least 6 characters" }
 *               samePassword:
 *                 value: { msg: "New password must be different from current password" }
 *               passwordMismatch:
 *                 value: { msg: "Passwords do not match" }
 *               incorrectPassword:
 *                 value: { msg: "Current password is incorrect" }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch("/change-password", protect, changePassword);

/**
 * @swagger
 * /user/announcements:
 *   get:
 *     summary: Get recent course update announcements
 *     description: Authenticated endpoint. Returns the most recent course change announcements (course created, course properties updated, course activated/deactivated, prerequisite added/removed) recorded by admins, newest first. Supports ?limit (max 100, default 20) and ?offset (default 0).
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized — token missing or invalid
 *       500:
 *         description: Server error
 */
router.get("/announcements", protect, getAnnouncements);

module.exports = router;
