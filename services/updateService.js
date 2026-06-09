const crypto = require("crypto");

const VALID_TYPES = new Set([
  "COURSE_CREATED",
  "COURSE_UPDATED",
  "COURSE_ACTIVATED",
  "COURSE_DEACTIVATED",
  "PREREQUISITE_ADDED",
  "PREREQUISITE_REMOVED",
]);

const recordCourseUpdate = async (
  session,
  { type, courseCode, summary, details, admin },
) => {
  if (!VALID_TYPES.has(type)) {
    throw new Error(`Invalid update type: ${type}`);
  }
  if (!courseCode) {
    throw new Error("courseCode is required");
  }

  const id = crypto.randomUUID();
  const detailsJson = JSON.stringify(details || {});

  try {
    await session.run(
      `
      MATCH (c:Course {Code: $courseCode})
      CREATE (u:CourseUpdate {
        id: $id,
        type: $type,
        courseCode: $courseCode,
        summary: $summary,
        details: $detailsJson,
        adminId: $adminId,
        adminUsername: $adminUsername,
        createdAt: datetime()
      })
      CREATE (c)-[:HAS_UPDATE]->(u)
      `,
      {
        courseCode,
        id,
        type,
        summary: summary || "",
        detailsJson,
        adminId: admin?.studentId || null,
        adminUsername: admin?.username || null,
      },
    );
  } catch (err) {
    // Never fail the main operation because of the audit log
    console.error("Failed to record course update:", err.message);
  }
};

module.exports = { recordCourseUpdate, VALID_TYPES };
