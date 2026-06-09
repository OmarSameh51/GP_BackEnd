const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "COURSE_CREATED",
        "COURSE_UPDATED",
        "COURSE_ACTIVATED",
        "COURSE_DEACTIVATED",
        "PREREQUISITE_ADDED",
        "PREREQUISITE_REMOVED",
      ],
      index: true,
    },
    courseCode: {
      type: String,
      required: true,
      index: true,
    },
    summary: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    adminId: { type: String, default: null },
    adminUsername: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);
