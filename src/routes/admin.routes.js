const express = require("express");
const router = express.Router();
const { getStripeBalance } = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  resolveDispute,
  sendDisputeMessage,
} = require("../controllers/admin.controller");

// Middleware para autenticação
router.use(authenticate);

// Rota para obter saldo do Stripe (somente admin)
router.get("/stripe/balance", authenticate, getStripeBalance);
router.post("/:id/resolve-dispute", authenticate, resolveDispute);
router.post("/:id/send-dispute-message", authenticate, sendDisputeMessage);

module.exports = router;
