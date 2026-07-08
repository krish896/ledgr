const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

module.exports = app;
