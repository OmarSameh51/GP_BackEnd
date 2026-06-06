const User = require("../models/User");
const { driver } = require("../config/neo4j");
const neo4j = require("neo4j-driver");
const { deleteStudentNode } = require("../services/neo4jRelationService");

const cleanNeo4jObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      neo4j.isInt(value) ? value.toNumber() : value,
    ]),
  );
};
const normalizeCourseCode = (courseCode) => {
  // cs 122 => CS122 | cS133=> CS133
  return courseCode.replace(/\s+/g, "").toUpperCase();
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

    await deleteStudentNode(studentId); //Neo4j
    await User.deleteOne({ studentId }); //Mongo

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
    const normalizedCourseCode = normalizeCourseCode(req.params.courseCode);
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
      { courseCode: normalizedCourseCode },
    );

    if (existingCourse.records.length === 0) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }

    // build dynamic SET query
    let updates = [];
    let params = {
      courseCode: normalizedCourseCode,
    };
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
    const normalizedCourseCode = normalizeCourseCode(req.params.courseCode);
    const result = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      RETURN c
      `,
      {
        courseCode: normalizedCourseCode,
      },
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
const getCourseRelations = async (req, res) => {
  const session = driver.session();

  try {
    const normalizedCourseCode = normalizeCourseCode(req.params.courseCode);
    // check if course exists
    const courseCheck = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      RETURN c
      `,
      {
        courseCode: normalizedCourseCode,
      },
    );

    if (courseCheck.records.length === 0) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }

    // prerequisites (Requires)
    const prerequisitesResult = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})-[:Requires]->(pre:Course)
      RETURN pre
      `,
      {
        courseCode: normalizedCourseCode,
      },
    );

    // unlocked courses
    const unlocksResult = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})<-[:Requires]-(next:Course)
      RETURN next
      `,
      {
        courseCode: normalizedCourseCode,
      },
    );

    const prerequisites = prerequisitesResult.records.map((record) =>
      cleanNeo4jObject(record.get("pre").properties),
    );

    const unlocks = unlocksResult.records.map((record) =>
      cleanNeo4jObject(record.get("next").properties),
    );

    res.json({
      courseCode: normalizedCourseCode,
      prerequisites,
      unlocks,
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
const addPrerequisite = async (req, res) => {
  const session = driver.session();

  try {
    const courseCode = normalizeCourseCode(req.params.courseCode);

    const prerequisiteCode = normalizeCourseCode(req.body.prerequisiteCode);

    if (!prerequisiteCode) {
      return res.status(400).json({
        msg: "prerequisiteCode is required",
      });
    }

    if (courseCode === prerequisiteCode) {
      return res.status(400).json({
        msg: "Course cannot require itself",
      });
    }

    // check courses exist
    const result = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      MATCH (pre:Course {Code: $prerequisiteCode})
      RETURN c, pre
      `,
      {
        courseCode,
        prerequisiteCode,
      },
    );

    if (result.records.length === 0) {
      return res.status(404).json({
        msg: "Course or prerequisite not found",
      });
    }

    // create Requires + Unlocks
    await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      MATCH (pre:Course {Code: $prerequisiteCode})

      MERGE (c)-[:Requires]->(pre)
      MERGE (pre)-[:Unlocks]->(c)
      `,
      {
        courseCode,
        prerequisiteCode,
      },
    );

    res.json({
      msg: `${courseCode} now requires ${prerequisiteCode}`,
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
const removePrerequisite = async (req, res) => {
  const session = driver.session();

  try {
    const courseCode = normalizeCourseCode(req.params.courseCode);

    const prerequisiteCode = normalizeCourseCode(req.params.prerequisiteCode);

    const result = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      -[r:Requires]->
      (pre:Course {Code: $prerequisiteCode})

      OPTIONAL MATCH
      (pre)-[u:Unlocks]->(c)

      DELETE r, u

      RETURN COUNT(r) AS deletedCount
      `,
      {
        courseCode,
        prerequisiteCode,
      },
    );

    const deletedCount = neo4j.integer.toNumber(
      result.records[0].get("deletedCount"),
    );

    if (deletedCount === 0) {
      return res.status(404).json({
        msg: "Relationship not found",
      });
    }

    res.json({
      msg: `${prerequisiteCode} removed from prerequisites of ${courseCode}`,
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
const getActiveCourses = async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (c:Course)
      WHERE c.isActive = true
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
const addCourse = async (req, res) => {
  const session = driver.session();

  try {
    let {
      Code,
      name,
      Credits,
      Semester,
      Required_level,
      Required_Hours,
      isActive,
    } = req.body;

    // normalize course code
    Code = normalizeCourseCode(Code);

    // validation
    if (!Code || typeof Code !== "string") {
      return res.status(400).json({
        msg: "Course code is required",
      });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        msg: "Course name is required",
      });
    }

    if (
      typeof Credits !== "number" ||
      !Number.isInteger(Credits) ||
      Credits <= 0
    ) {
      return res.status(400).json({
        msg: "Credits must be a positive integer",
      });
    }

    if (
      typeof Semester !== "number" ||
      !Number.isInteger(Semester) ||
      ![1, 2].includes(Semester)
    ) {
      return res.status(400).json({
        msg: "Semester must be 1 or 2",
      });
    }

    if (
      typeof Required_level !== "number" ||
      !Number.isInteger(Required_level) ||
      ![1, 2, 3, 4].includes(Required_level)
    ) {
      return res.status(400).json({
        msg: "Required_level must be between 1 and 4",
      });
    }

    if (
      typeof Required_Hours !== "number" ||
      !Number.isInteger(Required_Hours) ||
      Required_Hours < 0
    ) {
      return res.status(400).json({
        msg: "Required_Hours must be a positive integer",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        msg: "isActive must be boolean",
      });
    }

    // check if course exists
    const existingCourse = await session.run(
      `
      MATCH (c:Course {Code: $Code})
      RETURN c
      `,
      { Code },
    );

    if (existingCourse.records.length > 0) {
      return res.status(409).json({
        msg: "Course already exists",
      });
    }

    // create course
    const result = await session.run(
      `
      CREATE (c:Course {
        Code: $Code,
        name: $name,
        Credits: $Credits,
        Semester: $Semester,
        Required_level: $Required_level,
        Required_Hours: $Required_Hours,
        isActive: $isActive
      })
      RETURN c
      `,
      {
        Code,
        name,
        Credits: neo4j.int(Credits),
        Semester: neo4j.int(Semester),
        Required_level: neo4j.int(Required_level),
        Required_Hours: neo4j.int(Required_Hours),
        isActive,
      },
    );

    const rawCourse = result.records[0].get("c").properties;
    const course = cleanNeo4jObject(rawCourse);

    res.status(201).json({
      msg: "Course added successfully",
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
const getUnlockedCourses = async (req, res) => {
  const session = driver.session();

  try {
    const normalizedCourseCode = normalizeCourseCode(req.params.courseCode);

    // check if course exists
    const courseCheck = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      RETURN c
      `,
      {
        courseCode: normalizedCourseCode,
      },
    );

    if (courseCheck.records.length === 0) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }

    // get unlocked courses
    const result = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      <-[:Requires]-
      (next:Course)
      RETURN next
      ORDER BY next.Code
      `,
      {
        courseCode: normalizedCourseCode,
      },
    );

    const unlockedCourses = result.records.map((record) =>
      cleanNeo4jObject(record.get("next").properties),
    );

    res.json({
      courseCode: normalizedCourseCode,
      unlocksCount: unlockedCourses.length,
      unlocks: unlockedCourses,
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
  getCourseByCode,
  getAllCourses,
  getCourseRelations,
  addPrerequisite,
  removePrerequisite,
  getActiveCourses,
  addCourse,
  getUnlockedCourses,
};
