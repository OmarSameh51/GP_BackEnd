const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new student account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Ahmed"
 *               lastName:
 *                 type: string
 *                 example: "Hassan"
 *               username:
 *                 type: string
 *                 example: "ahmed.hassan"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ahmed@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "secret123"
 *               academicYear:
 *                 type: number
 *                 example: 3
 *               department:
 *                 type: string
 *                 example: "Computer Science"
 *               phoneNumber:
 *                 type: string
 *                 example: "+201012345678"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109ca"
 *                     studentId:
 *                       type: string
 *                       example: "STU-2026-ABC123D4"
 *                     email:
 *                       type: string
 *                       example: "ahmed@example.com"
 *       400:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "User already exists"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ahmed@example.com"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109ca"
 *                     studentId:
 *                       type: string
 *                       example: "STU-2026-ABC123D4"
 *                     email:
 *                       type: string
 *                       example: "ahmed@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "Ahmed"
 *                     lastName:
 *                       type: string
 *                       example: "Hassan"
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Invalid credentials"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 */
router.post("/login", login);

module.exports = router;
