const express = require("express");
const router = express.Router();
const { getStripeBalance } = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  resolveDispute,
  sendDisputeMessage,
  getDisputes,
  getDisputeById,
} = require("../controllers/admin.controller");

// Middleware para autenticação
router.use(authenticate);

// Rota para obter saldo do Stripe (somente admin)
router.get("/stripe/balance", authenticate, getStripeBalance);
router.get("/disputes", authenticate, getDisputes);
router.get("/disputes/:id", authenticate, getDisputeById);
router.post("/:id/resolve-dispute", authenticate, resolveDispute);
router.post("/:id/send-dispute-message", authenticate, sendDisputeMessage);

// Rota para obter disputas (somente admin)

module.exports = router;
