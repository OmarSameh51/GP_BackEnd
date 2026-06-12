const { driver } = require("../config/neo4j");
const neo4j = require("neo4j-driver");
const { runGuestAdvisor } = require("../services/publicService");
const aiAdvisorService = require("../services/aiAdvisorService");

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

const searchCourses = async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.json({ count: 0, courses: [] });
  }

  const limitRaw = Number(req.query.limit);
  const limit = Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 50 ? limitRaw : 20;

  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (c:Course)
      WHERE c.isActive = true
        AND (toLower(c.Code) CONTAINS toLower($q) OR toLower(c.name) CONTAINS toLower($q))
      RETURN c
      ORDER BY c.Code
      LIMIT $limit
      `,
      { q, limit: neo4j.int(limit) },
    );

    const courses = result.records.map((record) =>
      cleanNeo4jObject(record.get("c").properties),
    );

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

const validateGuestAdviceBody = (body) => {
  const {
    department,
    academicYear,
    preferredDepartment,
    semester,
    passedCourses,
  } = body || {};

  if (
    typeof department !== "string" ||
    !ALLOWED_DEPARTMENTS.includes(department)
  ) {
    return {
      error: `department must be one of: ${ALLOWED_DEPARTMENTS.join(", ")}`,
    };
  }

  if (
    typeof academicYear !== "number" ||
    !Number.isInteger(academicYear) ||
    ![1, 2, 3, 4].includes(academicYear)
  ) {
    return { error: "academicYear must be an integer between 1 and 4" };
  }

  if (preferredDepartment !== undefined && preferredDepartment !== null) {
    if (
      typeof preferredDepartment !== "string" ||
      !ALLOWED_DEPARTMENTS.includes(preferredDepartment)
    ) {
      return {
        error: `preferredDepartment must be one of: ${ALLOWED_DEPARTMENTS.join(", ")}`,
      };
    }
  }

  if (passedCourses !== undefined && !Array.isArray(passedCourses)) {
    return { error: "passedCourses must be an array" };
  }

  const validatedPassed = [];
  if (Array.isArray(passedCourses)) {
    for (const pc of passedCourses) {
      if (!pc || typeof pc !== "object") {
        return {
          error: "Each passedCourses entry must be an object with courseCode",
        };
      }
      if (typeof pc.courseCode !== "string" || !pc.courseCode.trim()) {
        return { error: "Each passedCourses entry needs a courseCode string" };
      }
      if (
        pc.grade !== undefined &&
        pc.grade !== null &&
        (typeof pc.grade !== "number" || pc.grade < 0 || pc.grade > 100)
      ) {
        return { error: "grade must be a number between 0 and 100" };
      }
      validatedPassed.push({
        courseCode: pc.courseCode,
        grade: typeof pc.grade === "number" ? pc.grade : null,
        isPassed: pc.isPassed !== false,
      });
    }
  }

  if (semester !== undefined && semester !== null && ![1, 2].includes(semester)) {
    return { error: "semester must be 1 or 2" };
  }

  return {
    payload: {
      department,
      academicYear,
      preferredDepartment: preferredDepartment || null,
      semester: semester === 1 || semester === 2 ? semester : null,
      passedCourses: validatedPassed,
    },
  };
};

const getAcademicAdvice = async (req, res) => {
  const { error, payload: guestPayload } = validateGuestAdviceBody(req.body);
  if (error) {
    return res.status(400).json({ msg: error });
  }

  try {
    if (process.env.AI_SERVICE_URL) {
      try {
        const aiResult = await aiAdvisorService.getGuestAdvice(guestPayload);
        return res.json(aiResult);
      } catch (aiErr) {
        console.warn(
          "AI advisor unreachable, falling back to deterministic:",
          aiErr.message,
        );
      }
    }

    const result = await runGuestAdvisor(guestPayload);
    res.json(result);
  } catch (err) {
    console.error("getAcademicAdvice failed:", err);
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

const getAcademicRoadmap = async (req, res) => {
  const { error, payload: guestPayload } = validateGuestAdviceBody(req.body);
  if (error) {
    return res.status(400).json({ msg: error });
  }

  try {
    const result = await aiAdvisorService.getGuestRoadmap(guestPayload);
    res.json(result);
  } catch (err) {
    console.error("getAcademicRoadmap failed:", err.message);
    res.status(502).json({
      msg: "AI advisor unavailable",
      error: err.response?.data?.detail || err.message,
    });
  }
};

module.exports = {
  getActiveCourses,
  searchCourses,
  getCourseByCode,
  getCourseRelations,
  getUnlockedCourses,
  getAcademicAdvice,
  getAcademicRoadmap,
  getAnnouncements,
};
