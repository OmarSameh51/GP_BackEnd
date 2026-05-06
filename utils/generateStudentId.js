const { v4: uuidv4 } = require("uuid");

const generateStudentId = () => {
  const year = new Date().getFullYear();

  const uuid = uuidv4().split("-")[0].toUpperCase();

  return `STU-${year}-${uuid}`;
};

module.exports = generateStudentId;
