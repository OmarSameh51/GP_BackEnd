const convertGradeToGPA = (grade) => {
  if (grade >= 90) return 4.0;
  if (grade >= 85) return 3.75;
  if (grade >= 80) return 3.4;
  if (grade >= 75) return 3.1;
  if (grade >= 70) return 2.8;
  if (grade >= 65) return 2.5;
  if (grade >= 60) return 2.25;
  if (grade >= 50) return 2;
  return 0;
};

module.exports = convertGradeToGPA;
