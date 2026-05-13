const convertGradeToGPA = (grade) => {
  if (grade >= 90) return 4.0; // A+
  if (grade >= 85) return 3.75; // A
  if (grade >= 80) return 3.4; // B+
  if (grade >= 75) return 3.1; // B
  if (grade >= 70) return 2.8; // C+
  if (grade >= 65) return 2.5; // C
  if (grade >= 60) return 2.25; // D+
  if (grade >= 50) return 2; // D
  return 1; // F
};

module.exports = convertGradeToGPA;
