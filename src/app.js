const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const jobsRoutes = require("./routes/jobs.routes");
const cookieParser = require("cookie-parser");
const ocrRoutes = require("./routes/ocr.routes");
const path = require("path");

const usersRoutes = require("./routes/users.routes");
const { globalErrorHandler } = require("./utils/error.handler");

const app = express();
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/jobs", jobsRoutes);
app.use("/users", usersRoutes);
app.use("/ocr", ocrRoutes);

//Static files
app.use("/models", express.static(path.join(__dirname, "../public/models")));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Manipulador de erros global
app.use(globalErrorHandler);

module.exports = app;
