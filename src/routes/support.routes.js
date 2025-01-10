// src/routes/support.routes.js
const express = require("express");
const router = express.Router();
const {
  getSupportChat,
  sendSupportMessage,
} = require("../controllers/support.controller");
const { authenticate } = require("../middlewares/auth.middleware");

// Rota principal para carregar mensagens
router.get("/:jobId/messages", authenticate, getSupportChat);
// Rota para enviar uma nova mensagem
router.post("/:jobId/messages", authenticate, sendSupportMessage);

module.exports = router;
