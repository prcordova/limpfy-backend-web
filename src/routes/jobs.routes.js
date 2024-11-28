const express = require("express");
const { createJob, getJobs } = require("../controllers/jobs.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/", authenticate, createJob);
router.get("/", authenticate, getJobs);

module.exports = router;
