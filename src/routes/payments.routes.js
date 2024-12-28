// src/routes/payments.routes.js
const express = require("express");
const router = express.Router();
const {
  createPaymentIntent,
  handleStripeWebhook,
  sendPaymentToWorker,
  createCheckoutSession,
} = require("../controllers/payments.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/roles.middleware");

console.log("Payments routes loaded"); // Log para verificar se as rotas estão sendo carregadas

// Rotas normais de pagamento (usar JSON normal)
router.post("/create-checkout-session", authenticate, createCheckoutSession);
router.post("/create-payment-intent", authenticate, createPaymentIntent);

// Webhook do Stripe (usar express.raw APENAS AQUI)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Payout (apenas admin)
router.post(
  "/pay-worker",
  authenticate,
  authorizeRoles("admin"),
  sendPaymentToWorker
);

module.exports = router;
