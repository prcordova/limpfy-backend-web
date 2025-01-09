const User = require("../models/user.model");

exports.activateHandsOn = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Verificar se o usuário é um trabalhador
    if (user.role !== "worker") {
      return res.status(403).json({
        message: "Apenas trabalhadores podem ativar o recurso 'Mão Amiga'.",
      });
    }

    const now = new Date();
    const lastActivation =
      user.workerDetails.lastHandsOnActivation || user.createdAt; // Usar a data de criação se nunca ativou
    const oneMonthLater = new Date(lastActivation);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    // Verificar se já passou um mês desde a última ativação ou criação
    if (now < oneMonthLater) {
      const daysUntilEligible = Math.ceil(
        (oneMonthLater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return res.status(400).json({
        message: `Faltam ${daysUntilEligible} dias para ativar o recurso 'Mão Amiga'.`,
      });
    }

    // Verificar se atingiu o número mínimo de trabalhos
    const minJobs = user.workerDetails.nextHandsOnThreshold || 20;
    if (user.workerDetails.completedJobs < minJobs) {
      const jobsLeft = minJobs - user.workerDetails.completedJobs;
      return res.status(400).json({
        message: `Faltam ${jobsLeft} trabalhos para atingir o mínimo de ${minJobs}.`,
      });
    }

    // Ativar o recurso 'Mão Amiga'
    user.workerDetails.handsOnActive = true;
    user.workerDetails.lastHandsOnActivation = now; // Atualiza a data de ativação
    user.workerDetails.nextHandsOnThreshold += 20; // Incrementa 20 trabalhos para a próxima ativação
    await user.save();

    res
      .status(200)
      .json({ message: "Recurso 'Mão Amiga' ativado com sucesso." });
  } catch (error) {
    console.error("Erro ao ativar 'Mão Amiga':", error);
    res.status(500).json({ message: "Erro ao ativar 'Mão Amiga'." });
  }
};

exports.getHandsOnStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.status(200).json({
      handsOn: user.handsOn,
    });
  } catch (error) {
    console.error("Erro ao buscar status do 'Mão Amiga':", error);
    res.status(500).json({ message: "Erro ao buscar status do 'Mão Amiga'." });
  }
};

exports.checkEligibility = async (req, res) => {
  try {
    const userId = req.user._id;

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const now = new Date();
    const lastActivation =
      user.workerDetails.lastHandsOnActivation || user.createdAt; // Usar a data de criação se nunca ativou
    const oneMonthLater = new Date(lastActivation);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const completedJobs = user.workerDetails.completedJobs;
    const minJobs = user.workerDetails.nextHandsOnThreshold || 20;

    const criteria = [];

    // Verificar se já passou um mês desde a última ativação ou criação
    if (now < oneMonthLater) {
      const daysUntilEligible = Math.ceil(
        (oneMonthLater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      criteria.push({
        name: "Tempo Mínimo Entre Solicitações",
        pending: daysUntilEligible,
        message: `Faltam ${daysUntilEligible} dias para ativar o recurso 'Mão Amiga'.`,
      });
    }

    // Verificar se atingiu o número mínimo de trabalhos
    if (completedJobs < minJobs) {
      const jobsLeft = minJobs - completedJobs;
      criteria.push({
        name: "Trabalhos Concluídos",
        pending: jobsLeft,
        message: `Faltam ${jobsLeft} trabalhos para atingir o mínimo de ${minJobs}.`,
      });
    }

    const isEligible = criteria.length === 0;

    res.status(200).json({
      isEligible,
      criteria,
    });
  } catch (error) {
    console.error("Erro ao verificar elegibilidade:", error);
    res.status(500).json({
      message: "Erro ao verificar elegibilidade.",
    });
  }
};
