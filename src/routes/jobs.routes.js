const express = require("express");
const path = require("path");
const fs = require("fs");
const {
  createJob,
  getJobs,
  getJobById,
  acceptJob,
  cancelJob,
  cancelOrder,
  updateJob,
  reactivateJob,
  getJobsByUserId,
  getMyJobs,
  getClientOrders,
  completeJob,
  openDispute,
  resolveDispute,
  sendDisputeMessage,
  rateJob,
  completeOrder,
  reportCarProblem,
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

// ----------------- Rotas para cliente -----------------
router.post("/create", authenticate, createJob);
router.get("/", authenticate, getJobs);
router.get("/my-jobs", authenticate, getMyJobs);
router.get("/client-jobs", authenticate, getClientOrders);

// ----------------- Rotas para trabalhador -----------------
router.get("/:id", authenticate, getJobById);
router.get("/user/:userId", authenticate, getJobsByUserId);
router.post("/:id/accept", authenticate, acceptJob);
router.post("/:id/cancel", authenticate, cancelJob);
router.post("/:id/cancel-order", authenticate, cancelOrder);
router.put("/:id/update", authenticate, updateJob);
router.post("/:id/reactivate", authenticate, reactivateJob);

// Rota principal de “completar trabalho” com envio de foto
router.post(
  "/:id/complete",
  authenticate,
  upload.single("cleanedPhoto"),
  completeJob
);
//Rotas de problemas com o trabalho
router.post("/:id/call-for-help", authenticate, reportCarProblem);

// ----------------- Rotas de disputa -----------------
router.post("/:id/open-dispute", authenticate, openDispute);
router.post("/:id/resolve-dispute", authenticate, resolveDispute);
router.post("/:id/send-dispute-message", authenticate, sendDisputeMessage);
router.post("/:id/rate", authenticate, rateJob);
router.post("/:id/complete-order", authenticate, completeOrder);

module.exports = router;
