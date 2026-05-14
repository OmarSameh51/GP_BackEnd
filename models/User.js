const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseCode: String,
  courseName: String,
  creditHours: Number,
  grade: Number, // max 100
  gradePoints: Number, // GPA Points 4
});

const aiPlanSchema = new mongoose.Schema(
  {
    // // // generatedAt: {
    // //   type: Date,
    // //   default: Date.now,
    // },
    plan: [
      {
        courseCode: String,
        courseName: String,
        creditHours: Number,
      },
    ],
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      unique: true,
    },

    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      unique: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },

    academicYear: Number,
    department: String,
    role: {
      type: String,
      enum: ["student", "admin", "super_admin"],
      default: "student",
    },
    gpa: Number,

    enrolledCourses: [courseSchema],

    totalCreditHours: {
      type: Number,
      default: 0,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    AI_plan: aiPlanSchema,

    phoneNumber: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
