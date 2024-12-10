const express = require("express");
const {
  getUserNotifications,
  deleteUserNotifications,
} = require("../controllers/notifications.controller copy");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/:id", authenticate, getUserNotifications);
router.delete("/:id", authenticate, deleteUserNotifications);

module.exports = router;
