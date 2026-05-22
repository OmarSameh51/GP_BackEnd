const User = require("../models/User");

const { getCourseFromNeo4j } = require("../services/courseService");

const convertGradeToGPA = require("../utils/gradeConverter");

const calculateGPA = require("../utils/calculateGPA");

const normalizeCourseCode = (courseCode) => {
  return courseCode.replace(/\s+/g, "").toUpperCase();
};

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

    // uppercase course code / normalize
    courseCode = normalizeCourseCode(courseCode);
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
    const hasPassed = existingCourses.some((c) => c.grade >= 50);

    if (hasPassed) {
      return res.status(400).json({
        msg: "You already passed this course",
      });
    }

    // check if already failed once
    const failedAttempt = existingCourses.find((c) => c.grade < 50);

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
    role: user.role,
    academicYear: user.academicYear,
    department: user.department,
    preferredDepartment: user.preferredDepartment,
    gpa: user.gpa,
    totalCreditHours: user.totalCreditHours,
    enrolledCourses: user.enrolledCourses,
    AI_plan: user.AI_plan,
    phoneNumber: user.phoneNumber,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
};
const editCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    let grade = req.body?.grade;

    // validation
    if (grade === undefined) {
      return res.status(400).json({
        msg: "Grade is required",
      });
    }

    grade = Number(grade);

    if (isNaN(grade) || grade < 0 || grade > 100) {
      return res.status(400).json({
        msg: "Grade must be between 0 and 100",
      });
    }

    // get user
    const user = await User.findById(userId);

    // get target course
    const course = user.enrolledCourses.id(courseId);

    if (!course) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }

    // get same course attempts except current one
    const sameCourses = user.enrolledCourses.filter(
      (c) =>
        c.courseCode === course.courseCode && c._id.toString() !== courseId,
    );

    // other failed attempts
    const otherFailedAttempts = sameCourses.filter((c) => c.grade < 50);

    // prevent 2 F attempts
    if (grade < 50 && otherFailedAttempts.length > 0) {
      return res.status(400).json({
        msg: "Only one failed attempt is allowed for this course",
      });
    }

    // update course
    course.grade = grade;
    course.gradePoints = convertGradeToGPA(grade);

    // recalculate GPA
    const result = calculateGPA(user.enrolledCourses);

    user.gpa = result.gpa;
    user.totalCreditHours = result.totalCreditHours;

    await user.save();

    res.json({
      msg: "Course updated successfully",
      course,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
const deleteCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    // get user
    const user = await User.findById(userId);

    // find course
    const course = user.enrolledCourses.id(courseId);

    if (!course) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }

    // remove course
    course.deleteOne();

    // recalculate GPA
    const result = calculateGPA(user.enrolledCourses);

    user.gpa = result.gpa;
    user.totalCreditHours = result.totalCreditHours;

    await user.save();

    res.json({
      msg: "Course deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
const updatePreferredDepartment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferredDepartment } = req.body;

    const allowedDepartments = ["AI", "CS", "IT", "IS"];

    // validation
    if (!preferredDepartment) {
      return res.status(400).json({
        msg: "Preferred department is required",
      });
    }

    if (!allowedDepartments.includes(preferredDepartment)) {
      return res.status(400).json({
        msg: "Invalid preferred department",
      });
    }

    // get user
    const user = await User.findById(userId);

    // student only
    if (user.role !== "student") {
      return res.status(403).json({
        msg: "Only students can set preferred department",
      });
    }

    // update
    user.preferredDepartment = preferredDepartment;

    await user.save();

    res.json({
      msg: "Preferred department updated successfully",
      preferredDepartment: user.preferredDepartment,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
module.exports = {
  getProfile,
  addCourse,
  editCourse,
  deleteCourse,
  updatePreferredDepartment,
};
