const { driver } = require("../config/neo4j");
const neo4j = require("neo4j-driver");
const crypto = require("crypto");

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

const detachDeleteGuest = async (guestId) => {
  const session = driver.session();
  try {
    await session.run(
      `
      MATCH (g:Guest {guestId: $guestId})
      DETACH DELETE g
      `,
      { guestId },
    );
  } finally {
    await session.close();
  }
};

const runGuestAdvisor = async ({
  department,
  academicYear,
  preferredDepartment = null,
  passedCourses = [],
}) => {
  const guestId = crypto.randomUUID();

  const normalizedPassed = passedCourses.map((pc) => ({
    courseCode: normalizeCourseCode(pc.courseCode),
    grade: typeof pc.grade === "number" ? pc.grade : null,
    isPassed: pc.isPassed !== false,
  }));

  const writeSession = driver.session();
  let payload;

  try {
    payload = await writeSession.executeWrite(async (tx) => {
      await tx.run(
        `
        CREATE (g:Guest {
          guestId: $guestId,
          department: $department,
          academicYear: $academicYear,
          preferredDepartment: $preferredDepartment,
          createdAt: datetime()
        })
        `,
        {
          guestId,
          department,
          academicYear: neo4j.int(academicYear),
          preferredDepartment,
        },
      );

      if (normalizedPassed.length > 0) {
        await tx.run(
          `
          MATCH (g:Guest {guestId: $guestId})
          UNWIND $passedCourses AS pc
          MATCH (c:Course {Code: pc.courseCode})
          WHERE c.isActive = true
          MERGE (g)-[r:TOOK {
            grade: pc.grade,
            isPassed: pc.isPassed
          }]->(c)
          `,
          { guestId, passedCourses: normalizedPassed },
        );
      }

      const availableResult = await tx.run(
        `
        MATCH (g:Guest {guestId: $guestId})
        MATCH (c:Course)
        WHERE c.isActive = true
          AND NOT (g)-[:TOOK]->(c)
          AND ALL(pre IN [(c)-[:Requires]->(pre:Course) | pre.Code]
                  WHERE pre IN [(g)-[:TOOK]->(t:Course) | t.Code])
        RETURN c
        ORDER BY c.Code
        `,
        { guestId },
      );

      const requiresPrereqsResult = await tx.run(
        `
        MATCH (g:Guest {guestId: $guestId})
        MATCH (c:Course)
        WHERE c.isActive = true
          AND NOT (g)-[:TOOK]->(c)
          AND ANY(pre IN [(c)-[:Requires]->(pre:Course) | pre.Code]
                  WHERE NOT pre IN [(g)-[:TOOK]->(t:Course) | t.Code])
        RETURN c
        ORDER BY c.Code
        `,
        { guestId },
      );

      const creditsResult = await tx.run(
        `
        MATCH (g:Guest {guestId: $guestId})
              -[r:TOOK]->
              (c:Course)
        WHERE r.isPassed = true
        RETURN coalesce(sum(c.Credits), 0) AS creditsPassed
        `,
        { guestId },
      );

      const coursesPassedResult = await tx.run(
        `
        MATCH (g:Guest {guestId: $guestId})
              -[r:TOOK]->
              (c:Course)
        WHERE r.isPassed = true
        RETURN count(c) AS coursesPassed
        `,
        { guestId },
      );

      const creditsValue = creditsResult.records[0].get("creditsPassed");
      const coursesPassedValue =
        coursesPassedResult.records[0].get("coursesPassed");

      return {
        available: availableResult.records.map((r) =>
          cleanNeo4jObject(r.get("c").properties),
        ),
        requiresPrereqs: requiresPrereqsResult.records.map((r) =>
          cleanNeo4jObject(r.get("c").properties),
        ),
        creditsPassed: neo4j.isInt(creditsValue)
          ? creditsValue.toNumber()
          : creditsValue || 0,
        coursesPassed: neo4j.isInt(coursesPassedValue)
          ? coursesPassedValue.toNumber()
          : coursesPassedValue || 0,
      };
    });
  } finally {
    await writeSession.close();
    try {
      await detachDeleteGuest(guestId);
    } catch (cleanupErr) {
      console.error(
        `Failed to clean up guest ${guestId}:`,
        cleanupErr.message,
      );
    }
  }

  return {
    guestId,
    aiUsed: false,
    summary: {
      department,
      academicYear,
      coursesPassed: payload.coursesPassed,
      creditsPassed: payload.creditsPassed,
      currentGPA: null,
    },
    availableNow: payload.available,
    requiresPrereqs: payload.requiresPrereqs,
    aiAdvice: null,
  };
};

const cleanupOrphanGuests = async (maxAgeMinutes = 60) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (g:Guest)
      WHERE g.createdAt < datetime() - duration({minutes: $maxAgeMinutes})
      DETACH DELETE g
      RETURN count(g) AS deletedCount
      `,
      { maxAgeMinutes: neo4j.int(maxAgeMinutes) },
    );

    const value = result.records[0]?.get("deletedCount");
    const deletedCount = neo4j.isInt(value) ? value.toNumber() : value || 0;
    return { deletedCount };
  } finally {
    await session.close();
  }
};

module.exports = {
  runGuestAdvisor,
  cleanupOrphanGuests,
};
