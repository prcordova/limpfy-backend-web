const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const jobsRoutes = require("./routes/jobs.routes");
const usersRoutes = require("./routes/users.routes");
const { globalErrorHandler } = require("./utils/error.handler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/jobs", jobsRoutes);
app.use("/users", usersRoutes);

// Manipulador de erros global
app.use(globalErrorHandler);

module.exports = app;
