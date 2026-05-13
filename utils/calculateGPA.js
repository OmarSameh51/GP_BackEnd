const calculateGPA = (courses) => {
  if (!courses || courses.length === 0) {
    return {
      gpa: 0,
      totalCreditHours: 0,
    };
  }

  let totalPoints = 0;
  let totalHoursForGPA = 0;
  let passedCreditHours = 0;

  courses.forEach((course) => {
    const creditHours = Number(course.creditHours) || 0;
    const gradePoints = Number(course.gradePoints) || 0;
    const grade = Number(course.grade) || 0;

    // GPA calculation (all attempts)
    totalPoints += creditHours * gradePoints;
    totalHoursForGPA += creditHours;

    // passed credit hours only
    if (grade >= 50) {
      passedCreditHours += creditHours;
    }
  });

  const gpa =
    totalHoursForGPA === 0
      ? 0
      : Number((totalPoints / totalHoursForGPA).toFixed(2));
  return {
    gpa,
    totalCreditHours: passedCreditHours,
  };
};

module.exports = calculateGPA;
