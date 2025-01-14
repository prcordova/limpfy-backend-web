const express = require("express");
const router = express.Router();
const { getStripeBalance } = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/stripe/balance", authenticate, getStripeBalance);

module.exports = router;
