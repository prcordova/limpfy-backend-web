const express = require("express");
const multer = require("multer");
const { validateDocument } = require("../controllers/ocr.controller");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/validate", upload.single("document"), validateDocument);

module.exports = router;
