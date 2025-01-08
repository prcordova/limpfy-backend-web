const Job = require("../models/job.model");
const User = require("../models/user.model");
const Report = require("../models/report.model");

const checkHandsOnEligibility = (user) => {
  const now = new Date();
  const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));

  // Reseta o limite mensal se necessário
  if (
    !user.workerDetails.lastReset ||
    user.workerDetails.lastReset < oneMonthAgo
  ) {
    user.workerDetails.handsOnUsed = 0;
    user.workerDetails.lastReset = new Date();
  }

  // Verifica se o usuário atingiu o limite
  if (user.workerDetails.handsOnUsed >= user.workerDetails.handsOnLimit) {
    throw new Error("Limite de solicitações de 'Mão Amiga' atingido este mês.");
  }

  // Verifica se o usuário atende os critérios de qualificação
  const monthsSinceCreation = Math.floor(
    (Date.now() - user.workerDetails.createdAt) / (30 * 24 * 60 * 60 * 1000)
  );
  const minJobs =
    monthsSinceCreation === 0
      ? 10
      : monthsSinceCreation === 1
      ? 15
      : monthsSinceCreation === 2
      ? 20
      : monthsSinceCreation === 3
      ? 30
      : 50;

  if (user.workerDetails.completedJobs < minJobs) {
    throw new Error(
      "Você ainda não atingiu os critérios mínimos para usar o recurso 'Mão Amiga'."
    );
  }
};

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

    // Verificar elegibilidade
    checkHandsOnEligibility(user);

    // Criar um novo trabalho "Mão Amiga"
    const handsOnJob = new Job({
      title: `${job.title} (Mão Amiga)`,
      clientId: job.clientId,
      location: job.location,
      description:
        description || "Ajuda solicitada para concluir este trabalho.",
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
