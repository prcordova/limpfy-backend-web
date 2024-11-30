const express = require("express");
const {
  createJob,
  getJobs,
  getJobById,
  getJobsByUserId,
} = require("../controllers/jobs.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/create", authenticate, createJob);
router.get("/get-jobs", authenticate, getJobs);
router.get("/job/:id", getJobById);
router.get("/jobs/user/:userId", getJobsByUserId);

module.exports = router;
