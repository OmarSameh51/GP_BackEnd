const convertGradeToGPA = (grade) => {
  if (grade >= 90) return 4.0;
  if (grade >= 85) return 3.7;
  if (grade >= 80) return 3.3;
  if (grade >= 75) return 3.0;
  if (grade >= 70) return 2.7;
  if (grade >= 65) return 2.3;
  if (grade >= 60) return 2.0;
  return 0;
};

module.exports = convertGradeToGPA;
