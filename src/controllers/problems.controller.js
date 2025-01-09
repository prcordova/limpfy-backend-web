const Job = require("../models/job.model");
const User = require("../models/user.model");
const Report = require("../models/report.model");
const { checkHandsOnEligibility } = require("./handsOn.controller");

exports.reportCarProblem = async (req, res) => {
  const { id: jobId } = req.params;
  const reporterId = req.user._id;
  const { description } = req.body; // Opcional

  try {
    // Verificar se o trabalho existe
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado." });
    }

    const user = await User.findById(reporterId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Verificar se o recurso 'Mão Amiga' está ativo
    if (!user.workerDetails.handsOnActive) {
      return res.status(403).json({
        message:
          "Recurso 'Mão Amiga' não está ativo. Por favor, ative para continuar.",
      });
    }

    // Verificar elegibilidade
    checkHandsOnEligibility(user);

    // Criar um novo trabalho "Mão Amiga"
    const handsOnJob = new Job({
      title: `${job.title} (Mão Amiga)`,
      clientId: job.clientId,
      location: job.location,
      description:
        description || "(Mão amiga) Solicitada para concluir este trabalho.",
      status: "handsOn",
      createdAt: new Date(),
    });

    await handsOnJob.save();

    // Atualizar o uso do recurso no usuário
    user.workerDetails.handsOnUsed += 1;
    await user.save();

    // Adicionar ao Report caso queira manter um registro
    const report = new Report({
      jobId: job._id,
      clientId: job.clientId,
      reporterId: reporterId,
      type: "Mão Amiga",
      description: description || "Sem descrição fornecida.",
    });

    await report.save();

    res.status(201).json({
      message: "Solicitação de 'Mão Amiga' criada com sucesso.",
      job: handsOnJob,
    });
  } catch (error) {
    console.error("Erro ao relatar problema com carro:", error);
    res.status(500).json({
      message: error.message || "Erro ao relatar problema com carro.",
    });
  }
};
