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
  generateAIPlan,
  generateAIRoadmap,
  forecastGPA,
  predictGrade,
  createSummary,
  listSummaries,
  getSummary,
  deleteSummary,
  updateAcademicYear,
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

/**
 * @swagger
 * /user/ai-plan/generate:
 *   post:
 *     summary: Generate an AI-powered course plan for the student
 *     description: Calls the GP_AI advisor service, persists the returned plan to `User.AI_plan`, and returns the full response (including notes and remainingHoursToGraduate). Student role only.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: AI plan generated and saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       courseCode: { type: string }
 *                       courseName: { type: string }
 *                       creditHours: { type: number }
 *                 notes: { type: string }
 *                 totalSuggestedCredits: { type: number }
 *                 remainingHoursToGraduate: { type: number }
 *                 currentGPA: { type: number }
 *                 candidatesConsidered: { type: number }
 *                 aiUsed: { type: boolean }
 *       401: { description: Unauthorized }
 *       403: { description: Only students can generate a plan }
 *       404: { description: User not found }
 *       502: { description: AI advisor unavailable }
 */
router.post("/ai-plan/generate", protect, generateAIPlan);

/**
 * @swagger
 * /user/ai-plan/roadmap:
 *   post:
 *     summary: Generate a semester-by-semester roadmap to graduation
 *     description: Calls the GP_AI advisor service, which simulates every remaining semester (prerequisites unlock term by term, semester offerings and credit caps respected) until the department's required hours are covered. The roadmap is returned transiently and is not persisted. Student role only.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               semester:
 *                 type: integer
 *                 enum: [1, 2]
 *                 description: The semester the plan starts from (defaults to 1)
 *     responses:
 *       200:
 *         description: Roadmap generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 terms:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       academicYear: { type: number }
 *                       semester: { type: number }
 *                       credits: { type: number }
 *                       courses:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             courseCode: { type: string }
 *                             courseName: { type: string }
 *                             creditHours: { type: number }
 *                 totalPlannedCredits: { type: number }
 *                 remainingHoursToGraduate: { type: number }
 *                 remainingAfterPlan: { type: number }
 *                 currentGPA: { type: number }
 *                 notes: { type: string }
 *       401: { description: Unauthorized }
 *       403: { description: Only students can generate a roadmap }
 *       404: { description: User not found }
 *       502: { description: AI advisor unavailable }
 */
router.post("/ai-plan/roadmap", protect, generateAIRoadmap);

/**
 * @swagger
 * /user/gpa-forecast:
 *   post:
 *     summary: Forecast the student's graduation GPA
 *     description: Calls the GP_AI service, which runs a RandomForestRegressor trained on student course histories to predict the GPA the student will likely graduate with, based on the courses they have taken and how many credit hours remain.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Forecast generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 forecastGPA: { type: number }
 *                 currentGPA: { type: number }
 *                 completedCredits: { type: number }
 *                 remainingCredits: { type: number }
 *                 sampleSize: { type: number }
 *                 aiUsed: { type: boolean }
 *       401: { description: Unauthorized }
 *       403: { description: Only students can forecast a GPA }
 *       404: { description: Student not found or not enough course history }
 *       502: { description: Forecast service unavailable }
 */
router.post("/gpa-forecast", protect, forecastGPA);

/**
 * @swagger
 * /user/grade-prediction:
 *   post:
 *     summary: Predict a course's final-exam score from internal marks
 *     description: Sends the coursework and midterm marks (with each component's max, since mark distributions differ per course) to the GP_AI service, where a RandomForestRegressor predicts the final-exam score out of the remaining marks, the projected course total out of 100, and the resulting letter grade.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [coursework, midterm]
 *             properties:
 *               coursework: { type: number, minimum: 0, example: 22 }
 *               midterm: { type: number, minimum: 0, example: 18 }
 *               courseworkMax: { type: number, default: 25, example: 30 }
 *               midtermMax: { type: number, default: 25, example: 20 }
 *     responses:
 *       200:
 *         description: Prediction generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 predictedFinal: { type: number }
 *                 finalMax: { type: number }
 *                 predictedTotal: { type: number }
 *                 letter: { type: string }
 *                 gradePoints: { type: number }
 *                 passLikely: { type: boolean }
 *       400: { description: Invalid coursework or midterm value }
 *       401: { description: Unauthorized }
 *       502: { description: Prediction service unavailable }
 */
router.post("/grade-prediction", protect, predictGrade);

/**
 * @swagger
 * /user/summaries:
 *   post:
 *     summary: Summarize a lecture text with AI and save it
 *     description: Sends the provided lecture text to the GP_AI service, stores the generated summary along with the given title, and returns the saved record.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, text]
 *             properties:
 *               title: { type: string, example: "Lecture 3 - Operating Systems" }
 *               text: { type: string, description: "Raw lecture text to summarize" }
 *     responses:
 *       201:
 *         description: Summary generated and saved
 *       400: { description: Title or text missing }
 *       401: { description: Unauthorized }
 *       502: { description: AI summarization unavailable }
 *   get:
 *     summary: List the student's saved lecture summaries
 *     description: Returns all saved summaries for the logged-in user, without the full lecture/summary text.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of summaries }
 *       401: { description: Unauthorized }
 */
router.post("/summaries", protect, createSummary);
router.get("/summaries", protect, listSummaries);

/**
 * @swagger
 * /user/summaries/{id}:
 *   get:
 *     summary: Get a single saved lecture summary
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Summary found }
 *       404: { description: Summary not found }
 *   delete:
 *     summary: Delete a saved lecture summary
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Summary deleted }
 *       404: { description: Summary not found }
 */
router.get("/summaries/:id", protect, getSummary);
router.delete("/summaries/:id", protect, deleteSummary);

/**
 * @swagger
 * /user/academic-year:
 *   patch:
 *     summary: Update student academic year
 *     description: Allows a student to update their academic year. Only students can perform this action.
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
 *               - academicYear
 *             properties:
 *               academicYear:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *                 example: 2
 *     responses:
 *       200:
 *         description: Academic year updated successfully
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
 *               missingField:
 *                 value: { msg: "Academic year is required" }
 *               invalidYear:
 *                 value: { msg: "Invalid academic year" }
 *               sameYear:
 *                 value: { msg: "Academic year is already set to this value" }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only students can update academic year
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch("/academic-year", protect, updateAcademicYear);
module.exports = router;
