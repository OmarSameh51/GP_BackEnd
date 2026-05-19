const User = require("../models/User");
const { driver } = require("../config/neo4j");
const neo4j = require("neo4j-driver");

const cleanNeo4jObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      neo4j.isInt(value) ? value.toNumber() : value,
    ]),
  );
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

    if (Required_level !== undefined) {
      if (
        typeof Required_level !== "number" ||
        !Number.isInteger(Required_level) ||
        ![1, 2, 3, 4].includes(Required_level)
      ) {
        return res.status(400).json({
          msg: "Required_level must be an integer between 1 and 4",
        });
      }
    }
    if (Required_Hours !== undefined) {
      if (
        typeof Required_Hours !== "number" ||
        !Number.isInteger(Required_Hours) ||
        Required_Hours < 0
      ) {
        return res.status(400).json({
          msg: "Required_Hours must be a positive integer",
        });
      }
    }

    if (Semester !== undefined) {
      if (
        typeof Semester !== "number" ||
        !Number.isInteger(Semester) ||
        ![1, 2].includes(Semester)
      ) {
        return res.status(400).json({
          msg: "Semester must be 1 or 2",
        });
      }
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
      params.Required_Hours = Required_Hours;
    }

    if (Required_level !== undefined) {
      updates.push("c.Required_level = $Required_level");
      params.Required_level = Required_level;
    }

    if (Semester !== undefined) {
      updates.push("c.Semester = $Semester");
      params.Semester = Semester;
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

    // get raw neo4j properties
    const rawCourse = updatedCourse.records[0].get("c").properties;

    // clean neo4j integers
    const course = cleanNeo4jObject(rawCourse);

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
const getAllCourses = async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (c:Course)
      RETURN c
      ORDER BY c.Code
    `);

    const courses = result.records.map((record) => {
      const rawCourse = record.get("c").properties;

      return cleanNeo4jObject(rawCourse);
    });

    res.json({
      count: courses.length,
      courses,
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
const getCourseByCode = async (req, res) => {
  const session = driver.session();

  try {
    const { courseCode } = req.params;

    const result = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      RETURN c
      `,
      { courseCode },
    );

    if (result.records.length === 0) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }

    const rawCourse = result.records[0].get("c").properties;

    const course = cleanNeo4jObject(rawCourse);

    res.json(course);
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
  getCourseByCode,
  getAllCourses,
};
