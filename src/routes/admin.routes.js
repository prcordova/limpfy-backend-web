const express = require("express");
const router = express.Router();
const { getStripeBalance } = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/auth.middleware");

// Middleware para autenticação
router.use(authenticate);

// Rota para obter saldo do Stripe (somente admin)
router.get("/stripe/balance", getStripeBalance);

module.exports = router;
