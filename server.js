require("dotenv").config();

const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const connectDB = require("./config/db");
const { connectNeo4j } = require("./config/neo4j");
const adminRoutes = require("./routes/admin");
const app = express();

app.use(express.json());

app.use(async (_req, _res, next) => {
  await connectDB();
  await connectNeo4j();
  next();
});

// Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ai Consultantion Agent GP API",
      version: "1.0.0",
      description:
        "API documentation for the Ai Consultant Agent Graduation Project backend",
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

// const swaggerSpec = swaggerJsdoc(swaggerOptions);
// app.use(
//   "/api/docs",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerSpec, {
//     customCssUrl:
//       "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui.min.css",
//     customJs: [
//       "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-bundle.min.js",
//       "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-standalone-preset.min.js",
//     ],
//   }),
// );

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", require("./routes/superAdmin"));
app.get("/", (req, res) => {
  res.send("API is running");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    msg: "Server error",
    error: err.message,
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
