const Announcement = require("../models/Announcement");

const VALID_TYPES = new Set([
  "COURSE_CREATED",
  "COURSE_UPDATED",
  "COURSE_ACTIVATED",
  "COURSE_DEACTIVATED",
  "PREREQUISITE_ADDED",
  "PREREQUISITE_REMOVED",
]);

const recordAnnouncement = async ({
  type,
  courseCode,
  summary,
  details,
  admin,
}) => {
  if (!VALID_TYPES.has(type)) {
    throw new Error(`Invalid announcement type: ${type}`);
  }
  if (!courseCode) {
    throw new Error("courseCode is required");
  }

  try {
    await Announcement.create({
      type,
      courseCode,
      summary: summary || "",
      details: details || {},
      adminId: admin?.studentId || null,
      adminUsername: admin?.username || null,
    });
  } catch (err) {
    // Never fail the main operation because of the audit log
    console.error("Failed to record announcement:", err.message);
  }
};

module.exports = { recordAnnouncement, VALID_TYPES };
