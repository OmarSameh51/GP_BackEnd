const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://127.0.0.1:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "password",
  ),
  { encrypted: false },
);

const connectNeo4j = async () => {
  try {
    await driver.verifyConnectivity();
    console.log("Neo4j connected");
  } catch (err) {
    console.error("Neo4j connection failed:", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  await driver.close();
});

module.exports = { driver, connectNeo4j };
