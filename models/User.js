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
      sparse: true,
      required: function () {
        return this.role === "student";
      },
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
      required: true,
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

    role: {
      type: String,
      enum: ["student", "admin", "super_admin"],
      default: "student",
    },

    academicYear: {
      type: Number,
      required: function () {
        return this.role === "student";
      },
    },

    department: {
      type: String,
      required: function () {
        return this.role === "student";
      },
    },
    preferredDepartment: {
      type: String,
      enum: ["AI", "CS", "IT", "IS", "General"],
      default: function () {
        return this.role === "student" ? "General" : undefined;
      },
    },
    gpa: {
      type: Number,
      default: function () {
        return this.role === "student" ? 0 : undefined;
      },
    },

    enrolledCourses: {
      type: [courseSchema],
      default: function () {
        return this.role === "student" ? [] : undefined;
      },
    },

    totalCreditHours: {
      type: Number,
      default: function () {
        return this.role === "student" ? 0 : undefined;
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    AI_plan: {
      type: aiPlanSchema,
      default: function () {
        return this.role === "student" ? {} : undefined;
      },
    },

    phoneNumber: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
