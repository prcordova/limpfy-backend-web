const Company = require("../models/company.model");
const Worker = require("../models/worker.model");

exports.addWorker = async (req, res) => {
  try {
    const { companyId } = req.params; // ID da empresa
    const workerData = req.body;

    // Criar trabalhador
    const newWorker = new Worker({
      ...workerData,
      companyId,
    });

    await newWorker.save();

    // Adicionar trabalhador à lista da empresa
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Empresa não encontrada." });
    }
    company.workers.push(newWorker._id);
    await company.save();

    res.status(201).json({
      message: "Trabalhador adicionado com sucesso.",
      worker: newWorker,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

  exports.getCompanyWorkers = async (req, res) => {
    try {
      const { companyId } = req.params;

      const company = await Company.findById(companyId).populate("workers");
      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada." });
      }

      res.json({ workers: company.workers });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
};
