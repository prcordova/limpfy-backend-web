const express = require("express");
const {
  getUserNotifications,
  deleteUserNotifications,
  markNotificationAsRead,
} = require("../controllers/notifications.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/:id", authenticate, getUserNotifications);
router.delete("/:id", authenticate, deleteUserNotifications);
router.patch("/:userId/:notificationId", authenticate, markNotificationAsRead);

module.exports = router;
