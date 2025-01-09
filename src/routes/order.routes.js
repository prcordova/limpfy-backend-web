const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  createOrder,
  getClientOrders,
  cancelOrder,
  updateOrder,
  completeOrder,
  openDisputeOrder,
  rateOrder,
} = require("../controllers/orders.controller");

const router = express.Router();

// Rotas para cliente
router.post("/create", authenticate, createOrder);
router.get("/client-jobs", authenticate, getClientOrders);
router.post("/:id/cancel-order", authenticate, cancelOrder);
router.put("/:id/update", authenticate, updateOrder);
router.post("/:id/complete-order", authenticate, completeOrder);
router.post("/:id/open-dispute", authenticate, openDisputeOrder);
router.post("/:id/rate", authenticate, rateOrder);

module.exports = router;
