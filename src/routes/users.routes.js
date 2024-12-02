const express = require("express");
const {
  getUsers,
  getUserById,
  acceptTerms,
  verifyFace,
} = require("../controllers/users.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/roles.middleware");
const router = express.Router();

router.get("/", authenticate, authorizeRoles("admin"), getUsers);
router.get("/:id", authenticate, getUserById);

//terms e face verification
router.post("/:id/accept-terms", authenticate, acceptTerms);
router.post("/verify-face", authenticate, verifyFace);

module.exports = router;
