const { driver } = require("../config/neo4j");

const getCourseFromNeo4j = async (code) => {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (c:Course)
WHERE toUpper(trim(c.Code)) = $code
RETURN c
      `,
      { code: code.trim().toUpperCase() },
    );

    if (result.records.length === 0) {
      return null;
    }

    return result.records[0].get("c").properties;
  } finally {
    await session.close();
  }
};

module.exports = { getCourseFromNeo4j };
