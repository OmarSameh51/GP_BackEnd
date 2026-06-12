const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    lectureText: {
      type: String,
      required: true,
    },
    summaryText: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Summary || mongoose.model("Summary", summarySchema);
