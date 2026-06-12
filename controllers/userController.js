const { driver } = require("../config/neo4j");

const User = require("../models/User");
const Summary = require("../models/Summary");

const { getAnnouncements } = require("./publicController");

const { getCourseFromNeo4j } = require("../services/courseService");

const convertGradeToGPA = require("../utils/gradeConverter");

const calculateGPA = require("../utils/calculateGPA");

const bcrypt = require("bcrypt");

const aiAdvisorService = require("../services/aiAdvisorService");

const normalizeCourseCode = (courseCode) => {
  return courseCode.replace(/\s+/g, "").toUpperCase();
};
const updateStudentNeo4jStats = async (user) => {
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (s:Student {studentId: $studentId})
      SET s.gpa = toFloat($gpa),
          s.totalCreditHours = toInteger($totalCreditHours),
          s.academicYear = toInteger($academicYear),
          s.department = $department,
          s.preferredDepartment = $preferredDepartment
      `,
      {
        studentId: user.studentId,
        gpa: user.gpa,
        totalCreditHours: user.totalCreditHours,
        academicYear: user.academicYear,
        department: user.department,
        preferredDepartment: user.preferredDepartment,
      },
    );
  } finally {
    await session.close();
  }
};

const {
  createTookRelation,
  deleteTookRelation,
  updateIntendsRelation,
} = require("../services/neo4jRelationService");

const addCourse = async (req, res) => {
  try {
    const userId = req.user.id;

    let { courseCode, grade, isPassed } = req.body;
    // validation first
    if (!courseCode || grade === undefined || isPassed === undefined) {
      return res.status(400).json({
        msg: "Course code, grade and isPassed are required",
      });
    }
    if (typeof isPassed !== "boolean") {
      return res.status(400).json({
        msg: "isPassed must be true or false",
      });
    }

    grade = Number(grade);

    if (isNaN(grade) || grade < 0 || grade > 100) {
      return res.status(400).json({
        msg: "Grade must be a number between 0 and 100",
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
    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }
    // get all attempts for this course
    const existingCourses = user.enrolledCourses.filter(
      (c) => c.courseCode === course.Code,
    );

    // check if already passed
    const hasPassed = existingCourses.some((c) => c.isPassed === true);
    if (hasPassed) {
      return res.status(400).json({
        msg: "You already passed this course",
      });
    }

    // check if already failed once
    const failedAttempt = existingCourses.find((c) => c.isPassed === false);
    // if already failed and trying another F
    if (failedAttempt && !isPassed) {
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
      isPassed,
      gradePoints,
    };
    // add course
    user.enrolledCourses.push(newCourse);
    // recalculate GPA and credit hours
    const result = calculateGPA(user.enrolledCourses);

    user.gpa = result.gpa;
    user.totalCreditHours = result.totalCreditHours;
    await user.save();
    if (isPassed) {
      await createTookRelation(user.studentId, course.Code);
    }
    await updateStudentNeo4jStats(user);
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

    let { grade, isPassed } = req.body;

    // validation
    if (grade === undefined || isPassed === undefined) {
      return res.status(400).json({
        msg: "Grade and isPassed are required",
      });
    }

    if (typeof isPassed !== "boolean") {
      return res.status(400).json({
        msg: "isPassed must be true or false",
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
    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }
    // get target course
    const course = user.enrolledCourses.id(courseId);

    if (!course) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }
    const oldIsPassed = course.isPassed;

    // get same course attempts except current one
    const sameCourses = user.enrolledCourses.filter(
      (c) =>
        c.courseCode === course.courseCode && c._id.toString() !== courseId,
    );

    // check if another passed attempt exists
    const alreadyPassed = sameCourses.some((c) => c.isPassed === true);

    if (isPassed && alreadyPassed) {
      return res.status(400).json({
        msg: "You already passed this course",
      });
    }

    // other failed attempts
    const failedAttempt = sameCourses.find((c) => c.isPassed === false);

    if (failedAttempt && !isPassed) {
      return res.status(400).json({
        msg: "Only one failed attempt is allowed for this course",
      });
    }

    // update course
    course.grade = grade;
    course.isPassed = isPassed;
    course.gradePoints = convertGradeToGPA(grade);
    if (!oldIsPassed && isPassed) {
      await createTookRelation(user.studentId, course.courseCode);
    }

    if (oldIsPassed && !isPassed) {
      await deleteTookRelation(user.studentId, course.courseCode);
    }

    // recalculate GPA
    const result = calculateGPA(user.enrolledCourses);

    user.gpa = result.gpa;
    user.totalCreditHours = result.totalCreditHours;

    await user.save();
    await updateStudentNeo4jStats(user);

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
    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }
    // find course
    const course = user.enrolledCourses.id(courseId);

    if (!course) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }
    const wasPassed = course.isPassed;
    if (wasPassed) {
      await deleteTookRelation(user.studentId, course.courseCode);
    }
    // remove course
    course.deleteOne();

    // recalculate GPA
    const result = calculateGPA(user.enrolledCourses);

    user.gpa = result.gpa;
    user.totalCreditHours = result.totalCreditHours;

    await user.save();
    await updateStudentNeo4jStats(user);

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
    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }
    // student only
    if (user.role !== "student") {
      return res.status(403).json({
        msg: "Only students can set preferred department",
      });
    }
    if (user.preferredDepartment === preferredDepartment) {
      return res.status(400).json({
        msg: "Preferred department is already set to this value",
      });
    }
    if (user.academicYear >= 3) {
      return res.status(403).json({
        msg: "Only year 1 and 2 students can change preferred department",
      });
    }
    // update
    user.preferredDepartment = preferredDepartment;

    await user.save();
    await updateIntendsRelation(user.studentId, preferredDepartment);
    await updateStudentNeo4jStats(user);

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
const updateDepartment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { department } = req.body;

    const allowedDepartments = ["AI", "CS", "IT", "IS"];

    // validation
    if (!department) {
      return res.status(400).json({
        msg: "Department is required",
      });
    }

    if (!allowedDepartments.includes(department)) {
      return res.status(400).json({
        msg: "Invalid department",
      });
    }

    // get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }
    // student only
    if (user.role !== "student") {
      return res.status(403).json({
        msg: "Only students can update department",
      });
    }
    if (user.academicYear <= 2) {
      return res.status(403).json({
        msg: "Level 1 and 2 students cannot change department",
      });
    }

    if (user.academicYear === 4) {
      return res.status(403).json({
        msg: "Level 4 students cannot change department",
      });
    }

    if (user.department === department) {
      return res.status(400).json({
        msg: "Department is already set to this value",
      });
    }
    // update mongo
    user.department = department;
    user.preferredDepartment = department;
    await user.save();

    // update neo4j
    await updateIntendsRelation(user.studentId, department);
    await updateStudentNeo4jStats(user);

    res.json({
      msg: "Department updated successfully",
      department: user.department,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        msg: "All fields are required",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        msg: "Password must be at least 6 characters",
      });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({
        msg: "New password must be different from current password",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        msg: "Passwords do not match",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({
      msg: "Password changed successfully",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};
const generateAIPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role !== "student") {
      return res.status(403).json({ msg: "Only students can generate an AI plan" });
    }

    const semesterRaw = req.body?.semester;
    const semester =
      semesterRaw === 1 || semesterRaw === 2 ? semesterRaw : undefined;
    const result = await aiAdvisorService.getStudentAdvice(user.studentId, {
      semester,
    });

    user.AI_plan = {
      plan: (result.plan || []).map(({ courseCode, courseName, creditHours }) => ({
        courseCode,
        courseName,
        creditHours,
      })),
    };
    await user.save();

    res.json(result);
  } catch (err) {
    console.error("generateAIPlan failed:", err.message);
    const status = err.response?.status === 404 ? 404 : 502;
    res.status(status).json({
      msg: "AI advisor unavailable",
      error: err.response?.data?.detail || err.message,
    });
  }
};

const generateAIRoadmap = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role !== "student") {
      return res.status(403).json({ msg: "Only students can generate a roadmap" });
    }

    const semesterRaw = req.body?.semester;
    const semester =
      semesterRaw === 1 || semesterRaw === 2 ? semesterRaw : undefined;
    const result = await aiAdvisorService.getStudentRoadmap(user.studentId, {
      semester,
    });

    res.json(result);
  } catch (err) {
    console.error("generateAIRoadmap failed:", err.message);
    const status = err.response?.status === 404 ? 404 : 502;
    res.status(status).json({
      msg: "AI advisor unavailable",
      error: err.response?.data?.detail || err.message,
    });
  }
};

const forecastGPA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role !== "student") {
      return res.status(403).json({ msg: "Only students can forecast a GPA" });
    }

    const result = await aiAdvisorService.getGpaForecast(user.studentId);
    res.json(result);
  } catch (err) {
    console.error("forecastGPA failed:", err.message);
    const status = err.response?.status === 404 ? 404 : 502;
    res.status(status).json({
      msg: "GPA forecast unavailable",
      error: err.response?.data?.detail || err.message,
    });
  }
};

const predictGrade = async (req, res) => {
  try {
    const coursework = Number(req.body?.coursework);
    const midterm = Number(req.body?.midterm);
    const courseworkMax = Number(req.body?.courseworkMax ?? 25);
    const midtermMax = Number(req.body?.midtermMax ?? 25);

    if (
      [coursework, midterm, courseworkMax, midtermMax].some(Number.isNaN) ||
      courseworkMax <= 0 || midtermMax <= 0 ||
      coursework < 0 || coursework > courseworkMax ||
      midterm < 0 || midterm > midtermMax
    ) {
      return res.status(400).json({
        msg: "coursework and midterm must be between 0 and their respective max marks",
      });
    }
    if (courseworkMax + midtermMax >= 100) {
      return res.status(400).json({
        msg: "coursework max + midterm max must be under 100 to leave marks for the final exam",
      });
    }

    const result = await aiAdvisorService.predictGrade({
      coursework,
      midterm,
      courseworkMax,
      midtermMax,
    });
    res.json(result);
  } catch (err) {
    console.error("predictGrade failed:", err.message);
    res.status(502).json({
      msg: "Grade prediction unavailable",
      error: err.response?.data?.detail || err.message,
    });
  }
};

const createSummary = async (req, res) => {
  try {
    const { title, text } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ msg: "Title is required" });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ msg: "Lecture text is required" });
    }

    const result = await aiAdvisorService.summarizeText(text);

    const summary = await Summary.create({
      user: req.user.id,
      title: title.trim(),
      lectureText: text,
      summaryText: result.summary,
    });

    res.status(201).json(summary);
  } catch (err) {
    console.error("createSummary failed:", err.message);
    const status = err.response?.status === 404 ? 404 : 502;
    res.status(status).json({
      msg: "AI summarization unavailable",
      error: err.response?.data?.detail || err.message,
    });
  }
};

const listSummaries = async (req, res) => {
  try {
    const summaries = await Summary.find({ user: req.user.id })
      .select("-lectureText -summaryText")
      .sort({ createdAt: -1 });
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const getSummary = async (req, res) => {
  try {
    const summary = await Summary.findOne({ _id: req.params.id, user: req.user.id });
    if (!summary) return res.status(404).json({ msg: "Summary not found" });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const deleteSummary = async (req, res) => {
  try {
    const summary = await Summary.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!summary) return res.status(404).json({ msg: "Summary not found" });
    res.json({ msg: "Summary deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = {
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
};
