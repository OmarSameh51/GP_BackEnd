const User = require("../models/User");
const bcrypt = require("bcrypt");

const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, phoneNumber } =
      req.body;

    // check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        msg: "User already exists",
      });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create admin
    const admin = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      role: "admin",
    });

    await admin.save();

    res.status(201).json({
      msg: "Admin created successfully",
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
    }).select("-password");

    res.json({
      count: students.length,
      students,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
module.exports = {
  createAdmin,
  getAllStudents,
};
