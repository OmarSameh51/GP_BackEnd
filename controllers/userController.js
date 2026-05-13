const User = require("../models/User");

const { getCourseFromNeo4j } = require("../services/courseService");

const convertGradeToGPA = require("../utils/gradeConverter");

const calculateGPA = require("../utils/calculateGPA");

const addCourse = async (req, res) => {
  try {
    const userId = req.user.id;

    let { courseCode, grade } = req.body;
    grade = Number(grade);
    // validation
    if (isNaN(grade) || grade < 0 || grade > 100) {
      return res.status(400).json({
        msg: "Grade must be a number between 0 and 100",
      });
    }
    if (!courseCode || grade === undefined) {
      return res.status(400).json({
        msg: "Course code and grade are required",
      });
    }

    // uppercase course code
    courseCode = courseCode.trim().toUpperCase();

    // get course from Neo4j
    const course = await getCourseFromNeo4j(courseCode);

    if (!course) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }

    // get user
    const user = await User.findById(userId);

    // get all attempts for this course
    const existingCourses = user.enrolledCourses.filter(
      (c) => c.courseCode === courseCode,
    );

    // check if already passed
    const hasPassed = existingCourses.some((c) => c.grade >= 60);

    if (hasPassed) {
      return res.status(400).json({
        msg: "You already passed this course",
      });
    }

    // check if already failed once
    const failedAttempt = existingCourses.find((c) => c.grade < 60);

    // if already failed and trying another F
    if (failedAttempt && grade < 50) {
      return res.status(400).json({
        msg: "You already failed this course once. Retake must be a passing grade",
      });
    }

    // convert grade to GPA
    const gradePoints = convertGradeToGPA(grade);

    // build course object
    const newCourse = {
      courseCode: course.Code,
      courseName: course.name,
      creditHours: Number(course.Credits),
      grade,
      gradePoints,
    };
    // add course
    user.enrolledCourses.push(newCourse);
    // recalculate GPA and credit hours
    const result = calculateGPA(user.enrolledCourses);

    user.gpa = result.gpa;
    user.totalCreditHours = result.totalCreditHours;
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

module.exports = { getProfile, addCourse };
