const express = require("express");
const {
  createJob,
  getJobs,
  getJobById,
  acceptJob,
  getJobsByUserId,
} = require("../controllers/jobs.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/jobs/create", authenticate, createJob);
router.get("/jobs", authenticate, getJobs);
router.get("/jobs/:id", authenticate, getJobById);
router.get("/jobs/user/:userId", authenticate, getJobsByUserId);
router.post("/jobs/:id/accept", authenticate, acceptJob);

module.exports = router;
