const { driver } = require("../config/neo4j");
const neo4j = require("neo4j-driver");
const { runGuestAdvisor } = require("../services/publicService");

const cleanNeo4jObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      neo4j.isInt(value) ? value.toNumber() : value,
    ]),
  );
};

const normalizeCourseCode = (courseCode) => {
  return courseCode.replace(/\s+/g, "").toUpperCase();
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

const getCourseByCode = async (req, res) => {
  const session = driver.session();

  try {
    const normalizedCourseCode = normalizeCourseCode(req.params.courseCode);

    const result = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      WHERE c.isActive = true
      RETURN c
      `,
      { courseCode: normalizedCourseCode },
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

    const courseCheck = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      WHERE c.isActive = true
      RETURN c
      `,
      { courseCode: normalizedCourseCode },
    );

    if (courseCheck.records.length === 0) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }

    const prerequisitesResult = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})-[:Requires]->(pre:Course)
      WHERE pre.isActive = true
      RETURN pre
      ORDER BY pre.Code
      `,
      { courseCode: normalizedCourseCode },
    );

    const unlocksResult = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})<-[:Requires]-(next:Course)
      WHERE next.isActive = true
      RETURN next
      ORDER BY next.Code
      `,
      { courseCode: normalizedCourseCode },
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

const getUnlockedCourses = async (req, res) => {
  const session = driver.session();

  try {
    const normalizedCourseCode = normalizeCourseCode(req.params.courseCode);

    const courseCheck = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      WHERE c.isActive = true
      RETURN c
      `,
      { courseCode: normalizedCourseCode },
    );

    if (courseCheck.records.length === 0) {
      return res.status(404).json({
        msg: "Course not found",
      });
    }

    const result = await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      <-[:Requires]-
      (next:Course)
      WHERE next.isActive = true
      RETURN next
      ORDER BY next.Code
      `,
      { courseCode: normalizedCourseCode },
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

const Announcement = require("../models/Announcement");

const getAnnouncements = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const docs = await Announcement.find()
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const announcements = docs.map((d) => ({
      id: d._id.toString(),
      type: d.type,
      courseCode: d.courseCode,
      summary: d.summary,
      details: d.details,
      adminId: d.adminId,
      adminUsername: d.adminUsername,
      createdAt: d.createdAt,
    }));

    res.json({
      count: announcements.length,
      offset,
      limit,
      announcements,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

const ALLOWED_DEPARTMENTS = ["AI", "CS", "IT", "IS", "General"];

const getAcademicAdvice = async (req, res) => {
  const {
    department,
    academicYear,
    preferredDepartment,
    passedCourses,
  } = req.body || {};

  if (
    typeof department !== "string" ||
    !ALLOWED_DEPARTMENTS.includes(department)
  ) {
    return res.status(400).json({
      msg: `department must be one of: ${ALLOWED_DEPARTMENTS.join(", ")}`,
    });
  }

  if (
    typeof academicYear !== "number" ||
    !Number.isInteger(academicYear) ||
    ![1, 2, 3, 4].includes(academicYear)
  ) {
    return res.status(400).json({
      msg: "academicYear must be an integer between 1 and 4",
    });
  }

  if (preferredDepartment !== undefined && preferredDepartment !== null) {
    if (
      typeof preferredDepartment !== "string" ||
      !ALLOWED_DEPARTMENTS.includes(preferredDepartment)
    ) {
      return res.status(400).json({
        msg: `preferredDepartment must be one of: ${ALLOWED_DEPARTMENTS.join(", ")}`,
      });
    }
  }

  if (passedCourses !== undefined && !Array.isArray(passedCourses)) {
    return res.status(400).json({
      msg: "passedCourses must be an array",
    });
  }

  const validatedPassed = [];
  if (Array.isArray(passedCourses)) {
    for (const pc of passedCourses) {
      if (!pc || typeof pc !== "object") {
        return res.status(400).json({
          msg: "Each passedCourses entry must be an object with courseCode",
        });
      }
      if (typeof pc.courseCode !== "string" || !pc.courseCode.trim()) {
        return res.status(400).json({
          msg: "Each passedCourses entry needs a courseCode string",
        });
      }
      if (
        pc.grade !== undefined &&
        pc.grade !== null &&
        (typeof pc.grade !== "number" || pc.grade < 0 || pc.grade > 100)
      ) {
        return res.status(400).json({
          msg: "grade must be a number between 0 and 100",
        });
      }
      validatedPassed.push({
        courseCode: pc.courseCode,
        grade: typeof pc.grade === "number" ? pc.grade : null,
        isPassed: pc.isPassed !== false,
      });
    }
  }

  try {
    const result = await runGuestAdvisor({
      department,
      academicYear,
      preferredDepartment: preferredDepartment || null,
      passedCourses: validatedPassed,
    });

    res.json(result);
  } catch (err) {
    console.error("getAcademicAdvice failed:", err);
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

module.exports = {
  getActiveCourses,
  getCourseByCode,
  getCourseRelations,
  getUnlockedCourses,
  getAcademicAdvice,
  getAnnouncements,
};
