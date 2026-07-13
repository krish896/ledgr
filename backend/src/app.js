const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const groupRoutes = require("./routes/group.routes");
const expenseRoutes = require("./routes/expense.routes");
const settlementRoutes = require("./routes/settlement.routes");
const { authenticate } = require("./middleware/auth.middleware");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/groups", authenticate, groupRoutes);
app.use("/expenses", authenticate, expenseRoutes);
app.use("/settlements", authenticate, settlementRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use(errorHandler);

module.exports = app;
