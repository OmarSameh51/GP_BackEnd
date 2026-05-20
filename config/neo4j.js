const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://127.0.0.1:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "neo4j",
    process.env.NEO4J_PASSWORD || "password",
  ),
);

let isConnected = false;

const connectNeo4j = async () => {
  if (isConnected) return;

  try {
    await driver.verifyConnectivity();
    isConnected = true;
    console.log("Neo4j connected");
  } catch (err) {
    console.error("Neo4j connection failed:", err.message);
  }
};

process.on("SIGINT", async () => {
  await driver.close();
});

module.exports = { driver, connectNeo4j };
