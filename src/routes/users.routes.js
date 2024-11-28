const express = require("express");
const { getUsers, getUserById } = require("../controllers/users.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/roles.middleware");
const router = express.Router();

router.get("/", authenticate, authorizeRoles("admin"), getUsers);
router.get("/:id", authenticate, getUserById);

module.exports = router;
