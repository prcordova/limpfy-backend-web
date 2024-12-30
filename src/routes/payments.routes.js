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

// Middleware exclusivo para webhook Stripe
router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // Necessário para assinatura do Stripe
  handleStripeWebhook
);

// Outras rotas
router.post("/create-checkout-session", authenticate, createCheckoutSession);
router.post("/create-payment-intent", authenticate, createPaymentIntent);
router.post(
  "/pay-worker",
  authenticate,
  authorizeRoles("admin"),
  sendPaymentToWorker
);

module.exports = router;
