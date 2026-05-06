const getProfile = (req, res) => {
  const user = req.user;

  res.json({
    _id: user._id,
    studentId: user.studentId,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    academicYear: user.academicYear,
    department: user.department,
    gpa: user.gpa,
    totalCreditHours: user.totalCreditHours,
    enrolledCourses: user.enrolledCourses,
    AI_plan: user.AI_plan,
    phoneNumber: user.phoneNumber,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
};

module.exports = { getProfile };
