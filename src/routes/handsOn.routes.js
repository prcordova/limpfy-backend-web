const express = require("express");
const {
  activateHandsOn,

  getHandsOnStatus,
} = require("../controllers/handsOn.controller");
const { checkEligibility } = require("../controllers/handsOn.controller");

const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/activate", authenticate, activateHandsOn);
router.get("/eligibility", authenticate, checkEligibility);

router.get("/status", authenticate, getHandsOnStatus);

module.exports = router;
