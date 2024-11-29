const express = require("express");
const { getCompanyWorkers } = require("../controllers/worker.controller");
const {
  authenticate,
  authorizeCompany,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Rota protegida: busca trabalhadores da empresa autenticada
router.get("/", authenticate, authorizeCompany, getCompanyWorkers);

module.exports = router;
