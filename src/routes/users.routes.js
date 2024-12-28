const express = require("express");
const {
  getUsers,
  getUserById,
  acceptTerms,
  verifyFace,
  updateProfile,
  resolveDispute,
} = require("../controllers/users.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/roles.middleware");
const { selfOrAdmin } = require("../middlewares/selfOrAdmin.middleware");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.params.id;
    // Ao invés de __dirname, use process.cwd()
    const uploadPath = path.join(process.cwd(), "public/uploads/users", userId);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const router = express.Router();

router.get("/", authenticate, authorizeRoles("admin"), getUsers);

router.get("/:id", authenticate, selfOrAdmin, getUserById);
router.put(
  "/:id/update-profile",
  authenticate,
  selfOrAdmin,
  upload.single("avatar"),
  updateProfile
);
router.post("/:id/accept-terms", authenticate, selfOrAdmin, acceptTerms);
router.post("/:id/verify-face", authenticate, selfOrAdmin, verifyFace);

module.exports = router;
