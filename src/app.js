// app.js
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth.routes");
const jobsRoutes = require("./routes/jobs.routes");
const usersRoutes = require("./routes/users.routes");
const ocrRoutes = require("./routes/ocr.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const paymentsRoutes = require("./routes/payments.routes");
const { globalErrorHandler } = require("./utils/error.handler");

const app = express();

// Middleware para webhook Stripe (usando express.raw() apenas nessa rota)
app.use("/payments/webhook", express.raw({ type: "application/json" }));

// Outros middlewares para o restante das rotas
app.use(express.json({ limit: "10mb" })); // Definindo limite para o body
app.use(cookieParser());
app.use(cors());

// Middlewares para servir arquivos estáticos
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));
app.use(express.static(path.join(__dirname, "public")));
app.use("/models", express.static(path.join(__dirname, "public/models")));

// Rotas
app.use("/auth", authRoutes);
app.use("/jobs", jobsRoutes);
app.use("/users", usersRoutes);
app.use("/ocr", ocrRoutes);
app.use("/payments", paymentsRoutes);
app.use("/notifications", notificationsRoutes);

// Manipulador de erros global
app.use(globalErrorHandler);

module.exports = app;
