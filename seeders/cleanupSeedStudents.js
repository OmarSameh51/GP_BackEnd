require("dotenv").config();

const connectDB = require("../config/db");
const { connectNeo4j, driver } = require("../config/neo4j");

const User = require("../models/User");

const cleanupSeedStudents = async () => {
  try {
    await connectDB();
    await connectNeo4j();

    console.log("Connected successfully");

    // Delete seed users from MongoDB
    const mongoResult = await User.deleteMany({
      firstName: "SEED",
    });

    console.log(`${mongoResult.deletedCount} seed users deleted from MongoDB`);

    // Delete seed students from Neo4j
    const session = driver.session();

    try {
      const neoResult = await session.run(`
        MATCH (s:Student)
        WHERE s.firstName = 'SEED'
        DETACH DELETE s
      `);

      console.log("Seed students deleted from Neo4j");
    } finally {
      await session.close();
    }

    console.log(`
=================================================
SEED DATA CLEANUP COMPLETED
=================================================
`);

    await driver.close();

    process.exit(0);
  } catch (err) {
    console.error("Cleanup Error:", err);

    await driver.close();

    process.exit(1);
  }
};

cleanupSeedStudents();
