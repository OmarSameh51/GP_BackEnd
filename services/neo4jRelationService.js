const { driver } = require("../config/neo4j");

const createTookRelation = async (studentId, courseCode) => {
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (s:Student {studentId: $studentId})
      MATCH (c:Course {Code: $courseCode})

      MERGE (s)-[:TOOK]->(c)
      `,
      {
        studentId,
        courseCode,
      },
    );
  } finally {
    await session.close();
  }
};

const deleteTookRelation = async (studentId, courseCode) => {
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (s:Student {studentId: $studentId})
            -[r:TOOK]->
            (c:Course {Code: $courseCode})

      DELETE r
      `,
      {
        studentId,
        courseCode,
      },
    );
  } finally {
    await session.close();
  }
};

const updateIntendsRelation = async (studentId, preferredDepartment) => {
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (s:Student {studentId: $studentId})

      OPTIONAL MATCH (s)-[r:INTENDS]->(:Department)
      DELETE r

      WITH s

      MATCH (d:Department {
      code: $preferredDepartment
 })

      MERGE (s)-[:INTENDS]->(d)
      `,
      {
        studentId,
        preferredDepartment,
      },
    );
  } finally {
    await session.close();
  }
};
const deleteStudentNode = async (studentId) => {
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (s:Student {studentId: $studentId})
      DETACH DELETE s
      `,
      { studentId },
    );
  } finally {
    await session.close();
  }
};
module.exports = {
  createTookRelation,
  deleteTookRelation,
  updateIntendsRelation,
  deleteStudentNode,
};
