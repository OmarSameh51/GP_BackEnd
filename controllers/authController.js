const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateStudentId = require("../utils/generateStudentId");
const { driver } = require("../config/neo4j");

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
      phoneNumber,
    } = req.body;

    //check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
      phoneNumber,
      role: "student",
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
