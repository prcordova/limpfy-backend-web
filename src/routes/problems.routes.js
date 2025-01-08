const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { reportCarProblem } = require("../controllers/problems.controller");

const router = express.Router();

router.post("/:id/report-car-problem", authenticate, reportCarProblem);

module.exports = router;
