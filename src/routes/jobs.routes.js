const express = require("express");
const {
  createJob,
  getJobs,
  getJobById,
  acceptJob,
  getJobsByUserId,
  cancelJob,
  getMyJobs,
  getClientJobs,
} = require("../controllers/jobs.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/create", authenticate, createJob);
router.get("/", authenticate, getJobs);
router.get("/my-jobs", authenticate, getMyJobs);

router.get("/client-jobs", authenticate, getClientJobs);

router.get("/:id", authenticate, getJobById);
router.get("/user/:userId", authenticate, getJobsByUserId);
router.post("/:id/accept", authenticate, acceptJob);
router.post("/:id/cancel", authenticate, cancelJob);
module.exports = router;
