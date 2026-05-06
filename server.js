const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// Middleware

app.use(express.json());

// Routes

app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));

app.get("/", (req, res) => {
  res.send("API is running ");
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
