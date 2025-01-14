const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");
const {
  sendTicketMessage,
  resolveTicket,
  getTickets,
  getTicketById,
} = require("../controllers/tickets.controller");

router.use(authenticate);

router.post("/:id/send-message", sendTicketMessage);
router.get("/", getTickets);
router.get("/:id", getTicketById);
router.post("/:id/resolve", resolveTicket);

module.exports = router;
