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

// Close the shared driver. Only call this during process shutdown — closing the
// driver without exiting leaves the pool permanently closed and every later
// query throws "Pool is closed, it is no more able to serve requests".
const closeNeo4j = async () => {
  if (!isConnected) return;
  await driver.close();
  isConnected = false;
};

module.exports = { driver, connectNeo4j, closeNeo4j };
