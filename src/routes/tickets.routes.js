const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");
const {
  sendTicketMessage,
  resolveTicket,
  getTickets,
  getTicketById,
  assignTicket,
  unassignTicket,
} = require("../controllers/tickets.controller");

router.use(authenticate);

router.get("/", getTickets);
router.get("/:id", getTicketById);
router.post("/:id/send-message", sendTicketMessage);
router.post("/:id/resolve", resolveTicket);
router.post("/:id/assign", assignTicket);
router.post("/:id/unassign", unassignTicket);

module.exports = router;
