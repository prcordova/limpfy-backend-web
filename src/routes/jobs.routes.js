const express = require("express");
const path = require("path");
const fs = require("fs");
const {
  getJobById,
  acceptJob,
  cancelJob,
  getJobsByUserId,
  completeJob,
  getJobs,
  getMyJobs,
} = require("../controllers/jobs.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const multer = require("multer");

//
// 1. Configurando o storage do Multer para salvar diretamente
//    em: public/uploads/users/:workerId/jobs/:jobId/cleans
//
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const jobId = req.params.id;
    const cleansDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "jobs",
      jobId,
      "cleans"
    );

    fs.mkdirSync(cleansDir, { recursive: true });
    cb(null, cleansDir);
  },
  filename: (req, file, cb) => {
    // Poderia renomear como quiser; aqui usando timestamp + nome original
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const router = express.Router();

// ----------------- Rotas para trabalhador -----------------
router.get("/", authenticate, getJobs);
router.get("/my-jobs", authenticate, getMyJobs);
router.get("/:id", authenticate, getJobById);

router.get("/user/:userId", authenticate, getJobsByUserId);
router.post("/:id/accept", authenticate, acceptJob);
router.post("/:id/cancel", authenticate, cancelJob);
router.post(
  "/:id/complete",
  authenticate,
  upload.single("cleanedPhoto"),
  completeJob
);

module.exports = router;
