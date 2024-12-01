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

router.post("/create", authenticate, createJob);
router.get("/", authenticate, getJobs);
router.get("/:id", authenticate, getJobById);
router.get("/user/:userId", authenticate, getJobsByUserId);
router.post("/:id/accept", authenticate, acceptJob);

module.exports = router;
