const express = require("express");
const {
  getUsers,
  getUserById,
  acceptTerms,
  verifyFace,
  updateProfile,
  deleteUserNotifications,
} = require("../controllers/users.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/roles.middleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { getUserNotifications } = require("../controllers/users.controller");

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.params.id;
    const uploadPath = path.join(
      __dirname,
      "../../public/uploads/users",
      userId
    );
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
router.get("/:id", authenticate, getUserById);

// Terms and face verification
router.post("/:id/accept-terms", authenticate, acceptTerms);
router.post("/:id/verify-face", authenticate, verifyFace);

// Update profile
router.put(
  "/:id/update-profile",
  authenticate,
  upload.single("avatar"),
  updateProfile
);

router.get("/:id/notifications", authenticate, getUserNotifications);
router.delete("/:id/notifications", authenticate, deleteUserNotifications);

module.exports = router;
