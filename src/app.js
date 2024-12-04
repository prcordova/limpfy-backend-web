const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth.routes");
const jobsRoutes = require("./routes/jobs.routes");
const usersRoutes = require("./routes/users.routes");
const ocrRoutes = require("./routes/ocr.routes");
const { globalErrorHandler } = require("./utils/error.handler");

const app = express();
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Middleware para servir arquivos estáticos da pasta uploads
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Outros middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use("/auth", authRoutes);
app.use("/jobs", jobsRoutes);
app.use("/users", usersRoutes);
app.use("/ocr", ocrRoutes);

// Static files
app.use("/models", express.static(path.join(__dirname, "public/models")));

// Manipulador de erros global
app.use(globalErrorHandler);

module.exports = app;
