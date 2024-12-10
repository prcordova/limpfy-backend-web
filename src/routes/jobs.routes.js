const express = require("express");

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
  getClientJobs,
  completeJob,
  openDispute,
  resolveDispute,
  sendDisputeMessage,
  rateJob,
} = require("../controllers/jobs.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const multer = require("multer");

const upload = multer({ dest: "tmp/uploads" });
const router = express.Router();

// cliente
router.post("/create", authenticate, createJob);
router.get("/", authenticate, getJobs);
router.get("/my-jobs", authenticate, getMyJobs);
router.get("/client-jobs", authenticate, getClientJobs);

// trabalhador
router.get("/:id", authenticate, getJobById);
router.get("/user/:userId", authenticate, getJobsByUserId);
router.post("/:id/accept", authenticate, acceptJob);
router.post("/:id/cancel", authenticate, cancelJob);
router.post("/:id/cancel-order", authenticate, cancelOrder);
router.put("/:id/update", authenticate, updateJob);
router.post("/:id/reactivate", authenticate, reactivateJob);
router.post(
  "/:id/complete",
  authenticate,
  upload.single("cleanedPhoto"),
  completeJob
);
//disputas
router.post("/:id/open-dispute", authenticate, openDispute);

router.post("/:id/resolve-dispute", authenticate, resolveDispute);
router.post("/:id/send-dispute-message", authenticate, sendDisputeMessage);
router.post("/:id/rate", authenticate, rateJob);

module.exports = router;
