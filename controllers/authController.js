const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateStudentId = require("../utils/generateStudentId");
const { driver } = require("../config/neo4j");
const { updateIntendsRelation } = require("../services/neo4jRelationService");
const { sendVerificationEmail } = require("../services/emailService");
// REGISTER
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      academicYear,
      department,
      preferredDepartment,
      phoneNumber,
    } = req.body;

    //check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      return res.status(400).json({
        msg: "Username already exists",
      });
    }

    //Year Validation
    if (![1, 2, 3, 4].includes(Number(academicYear))) {
      return res.status(400).json({
        msg: "Academic year must be between 1 and 4",
      });
    }

    //Department Validation
    const allowedAllDepartments = ["General", "AI", "CS", "IT", "IS"];

    if (!allowedAllDepartments.includes(department)) {
      return res.status(400).json({
        msg: "Invalid department",
      });
    }
    // Year 1 & 2 must be General
    if (academicYear <= 2 && department !== "General") {
      return res.status(400).json({
        msg: "Level 1 and 2 students must belong to General department",
      });
    }

    // Preferred department required for year 1 & 2
    if (academicYear <= 2 && !preferredDepartment) {
      return res.status(400).json({
        msg: "Preferred department is required",
      });
    }
    const allowedDepartments = ["AI", "CS", "IT", "IS"];
    if (
      preferredDepartment &&
      !allowedDepartments.includes(preferredDepartment)
    ) {
      return res.status(400).json({
        msg: "Invalid preferred department",
      });
    }
    let finalPreferredDepartment;

    if (academicYear <= 2) {
      finalPreferredDepartment = preferredDepartment;
    } else {
      finalPreferredDepartment = department;
    }
    if (academicYear >= 3 && department === "General") {
      return res.status(400).json({
        msg: "Level 3 and 4 students cannot belong to General department",
      });
    }
    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    // generate ID
    const studentId = generateStudentId();

    // create user
    const user = new User({
      studentId,
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      academicYear,
      department,
      preferredDepartment: finalPreferredDepartment,
      phoneNumber,
      role: "student",

      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
    });

    await user.save();

    const session = driver.session();

    try {
      await session.run(
        `
    CREATE (s:Student {
      studentId: $studentId,
      firstName: $firstName,
      lastName: $lastName,
      department: $department,
      academicYear: toInteger($academicYear),
      preferredDepartment: $preferredDepartment,
      gpa: $gpa,
     totalCreditHours: toInteger($totalCreditHours)
    })
    `,
        {
          studentId: user.studentId,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department,
          academicYear: user.academicYear,
          preferredDepartment: user.preferredDepartment,
          gpa: user.gpa,
          totalCreditHours: user.totalCreditHours,
        },
      );
    } catch (neoErr) {
      await User.findByIdAndDelete(user._id);

      throw new Error("Failed to create student node in Neo4j");
    } finally {
      await session.close();
    }
    await updateIntendsRelation(user.studentId, user.preferredDepartment);
    try {
      await sendVerificationEmail(user.email, verificationCode);
    } catch (emailErr) {
      console.error("Verification email failed:");
      console.error(emailErr);
    }
    res.status(201).json({
      msg: "User registered successfully",
      user: {
        id: user._id,
        studentId: user.studentId,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    // 2) check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // 3) generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    res.json({
      token,
      user: {
        id: user._id,
        studentId: user.studentId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({
        msg: "Email and code are required",
      });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        msg: "Email already verified",
      });
    }

    if (user.emailVerificationCode !== code) {
      return res.status(400).json({
        msg: "Invalid verification code",
      });
    }

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      return res.status(400).json({
        msg: "Verification code expired",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;

    await user.save();

    res.json({
      msg: "Email verified successfully",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
