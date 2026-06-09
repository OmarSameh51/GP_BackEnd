require("dotenv").config();
const { driver } = require("../config/neo4j");

(async () => {
  const session = driver.session();
  try {
    await session.run(
      `CREATE CONSTRAINT course_update_id IF NOT EXISTS FOR (u:CourseUpdate) REQUIRE u.id IS UNIQUE`,
    );
    console.log("Constraint course_update_id ensured.");
    await session.run(
      `CREATE INDEX course_update_created IF NOT EXISTS FOR (u:CourseUpdate) ON (u.createdAt)`,
    );
    console.log("Index course_update_created ensured.");
  } catch (err) {
    console.error("Failed to create indexes:", err.message);
  } finally {
    await session.close();
    await driver.close();
  }
})();
