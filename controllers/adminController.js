const User = require("../models/User");
const { driver } = require("../config/neo4j");

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

const updateCourseProperties = async (req, res) => {
  const session = driver.session();

  try {
    const { courseCode } = req.params;

    const { isActive, Required_Hours, Required_level, Semester } = req.body;

    // validation

    if (isActive !== undefined && typeof isActive !== "boolean") {
      return res.status(400).json({
        msg: "isActive must be boolean",
      });
    }

    if (
      Required_level !== undefined &&
      (!Number.isInteger(Number(Required_level)) ||
        ![1, 2, 3, 4].includes(Number(Required_level)))
    ) {
      return res.status(400).json({
        msg: "Required_level must be between 1 and 4",
      });
    }

    if (
      Required_Hours !== undefined &&
      (isNaN(Number(Required_Hours)) || Number(Required_Hours) < 0)
    ) {
      return res.status(400).json({
        msg: "Required_Hours must be a valid number",
      });
    }

    if (Semester !== undefined && ![1, 2].includes(Number(Semester))) {
      return res.status(400).json({
        msg: "Semester must be 1 or 2",
      });
    }

    // check if course exists
    const existingCourse = await session.run(
      `
        MATCH (c:Course {Code: $courseCode})
        RETURN c
        `,
      { courseCode },
    );

    if (existingCourse.records.length === 0) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }

    // build dynamic SET query
    let updates = [];
    let params = { courseCode };

    if (isActive !== undefined) {
      updates.push("c.isActive = $isActive");
      params.isActive = isActive;
    }

    if (Required_Hours !== undefined) {
      updates.push("c.Required_Hours = $Required_Hours");
      params.Required_Hours = Number(Required_Hours);
    }

    if (Required_level !== undefined) {
      updates.push("c.Required_level = $Required_level");
      params.Required_level = Number(Required_level);
    }

    if (Semester !== undefined) {
      updates.push("c.Semester = $Semester");
      params.Semester = Number(Semester);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        msg: "No fields provided to update",
      });
    }

    // update course
    const query = `
      MATCH (c:Course {Code: $courseCode})
      SET ${updates.join(", ")}
      RETURN c
    `;

    const updatedCourse = await session.run(query, params);

    const course = updatedCourse.records[0].get("c").properties;

    res.json({
      msg: "Course updated successfully",
      course,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  } finally {
    await session.close();
  }
};
module.exports = {
  getAllStudents,
  getStudentById,
  deleteStudent,
  updateCourseProperties,
};
