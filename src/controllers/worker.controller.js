const Worker = require("../models/worker.model");

exports.getCompanyWorkers = async (req, res) => {
  try {
    const { companyId } = req;

    // Busca trabalhadores apenas da empresa autenticada
    const workers = await Worker.find({ companyId });

    res.status(200).json(workers);
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar trabalhadores." });
  }
};
