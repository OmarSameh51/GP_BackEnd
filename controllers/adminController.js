const User = require("../models/User");
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

const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({
      studentId,
      role: "student",
    }).select("-password");

    if (!student) {
      return res.status(404).json({
        msg: "Student not found",
      });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({
      studentId,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        msg: "Student not found",
      });
    }

    await User.deleteOne({ studentId });

    res.json({
      msg: "Student deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
module.exports = {
  getAllStudents,
  getStudentById,
  deleteStudent,
};
