const User = require("../models/User");

const { getCourseFromNeo4j } = require("../services/courseService");

const convertGradeToGPA = require("../utils/gradeConverter");

exports.addCourse = async (req, res) => {
  try {
    const userId = req.user.id;

    let { courseCode, grade } = req.body;

    // make course code uppercase
    courseCode = courseCode.trim().toUpperCase();

    // get course from Neo4j
    const course = await getCourseFromNeo4j(courseCode);

    if (!course) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }

    // convert grade to GPA
    const gradePoints = convertGradeToGPA(grade);

    // build course object
    const newCourse = {
      courseCode: course.code,
      courseName: course.name,
      creditHours: course.creditHours,
      grade,
      gradePoints,
    };

    // get user
    const user = await User.findById(userId);

    // add course
    user.enrolledCourses.push(newCourse);

    await user.save();

    res.json({
      msg: "Course added successfully",
      course: newCourse,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
const getProfile = (req, res) => {
  const user = req.user;

  res.json({
    _id: user._id,
    studentId: user.studentId,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    academicYear: user.academicYear,
    department: user.department,
    gpa: user.gpa,
    totalCreditHours: user.totalCreditHours,
    enrolledCourses: user.enrolledCourses,
    AI_plan: user.AI_plan,
    phoneNumber: user.phoneNumber,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
};

module.exports = { getProfile };
