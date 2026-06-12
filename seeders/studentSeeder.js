require("dotenv").config();

const bcrypt = require("bcrypt");

const connectDB = require("../config/db");
const { connectNeo4j, driver } = require("../config/neo4j");

const User = require("../models/User");

const generateStudentId = require("../utils/generateStudentId");

const { updateIntendsRelation } = require("../services/neo4jRelationService");

const departments = ["AI", "CS", "IT", "IS"];

const seedStudents = async () => {
  try {
    await connectDB();
    await connectNeo4j();

    console.log("Connected successfully");

    // Cleanup Mongo
    await User.deleteMany({
      firstName: "SEED",
    });

    console.log("Old seed users deleted from MongoDB");

    // Cleanup Neo4j
    const cleanupSession = driver.session();

    await cleanupSession.run(`
      MATCH (s:Student)
      WHERE s.firstName = 'SEED'
      DETACH DELETE s
    `);

    await cleanupSession.close();

    console.log("Old seed students deleted from Neo4j");

    // Hash password once
    const hashedPassword = await bcrypt.hash("123456", 10);

    const users = [];

    for (let i = 1; i <= 100; i++) {
      let academicYear;

      if (i <= 25) {
        academicYear = 1;
      } else if (i <= 50) {
        academicYear = 2;
      } else if (i <= 75) {
        academicYear = 3;
      } else {
        academicYear = 4;
      }

      let department;
      let preferredDepartment;

      if (academicYear <= 2) {
        department = "General";

        preferredDepartment =
          departments[Math.floor(Math.random() * departments.length)];
      } else {
        department =
          departments[Math.floor(Math.random() * departments.length)];

        preferredDepartment = department;
      }

      const user = new User({
        studentId: generateStudentId(),

        firstName: "SEED",
        lastName: `Student${i}`,

        username: `seed${i}`,

        email: `seed${i}@test.com`,

        password: hashedPassword,

        role: "student",

        academicYear,

        department,

        preferredDepartment,

        isEmailVerified: true,

        emailVerificationCode: null,
        emailVerificationExpires: null,

        gpa: 0,
        totalCreditHours: 0,
      });

      await user.save();

      users.push(user);
    }

    console.log(`${users.length} users created in MongoDB`);

    console.log("Creating Neo4j nodes...");

    for (const user of users) {
      const session = driver.session();

      try {
        await session.run(
          `
          CREATE (s:Student {
            studentId: $studentId,
            firstName: $firstName,
            lastName: $lastName,
            department: $department,
            academicYear: toInteger($academicYear),
            preferredDepartment: $preferredDepartment,
            gpa: 0,
            totalCreditHours: 0
          })
          `,
          {
            studentId: user.studentId,
            firstName: user.firstName,
            lastName: user.lastName,
            department: user.department,
            academicYear: user.academicYear,
            preferredDepartment: user.preferredDepartment,
          },
        );

        await updateIntendsRelation(user.studentId, user.preferredDepartment);
      } finally {
        await session.close();
      }
    }

    console.log("Neo4j nodes created");
    console.log("INTENDS relations created");

    console.log(`
=================================================
100 STUDENTS SEEDED SUCCESSFULLY

Password For All Users: 123456

Examples:

seed1@test.com
seed2@test.com
seed3@test.com

...

seed100@test.com

=================================================
`);

    await driver.close();

    process.exit(0);
  } catch (err) {
    console.error("Seeder Error:", err);

    await driver.close();

    process.exit(1);
  }
};

seedStudents();
