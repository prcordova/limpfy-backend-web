const User = require("../models/user.model");

exports.activateHandsOn = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const now = new Date();
    const lastActivation =
      user.workerDetails.lastHandsOnActivation || user.workerDetails.createdAt;
    const oneMonthLater = new Date(lastActivation);
    oneMonthLater.setDate(oneMonthLater.getDate() + 30); // Adiciona 30 dias

    if (now < oneMonthLater) {
      const daysUntilEligible = Math.ceil(
        (oneMonthLater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return res.status(400).json({
        message: `Faltam ${daysUntilEligible} dias para ativar o recurso 'Mão Amiga'.`,
      });
    }

    const minJobs = user.workerDetails.nextHandsOnThreshold || 10;
    if (user.workerDetails.completedJobs < minJobs) {
      return res.status(400).json({
        message: `Faltam ${
          minJobs - user.workerDetails.completedJobs
        } trabalhos para atingir o mínimo de ${minJobs}.`,
      });
    }

    // Ativar "Mão Amiga"
    user.workerDetails.handsOnActive = true;
    user.workerDetails.lastHandsOnActivation = new Date();
    user.workerDetails.nextHandsOnThreshold += 10; // Incrementa em 10 trabalhos
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
      user.workerDetails.lastHandsOnActivation || user.createdAt; // Usando o `createdAt` global
    const oneMonthLater = new Date(lastActivation);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const completedJobs = user.workerDetails.completedJobs;
    const minJobs = user.workerDetails.nextHandsOnThreshold || 10;

    const criteria = [];

    // Verificar se atingiu o mínimo de trabalhos
    if (completedJobs < minJobs) {
      criteria.push({
        name: "Trabalhos Concluídos",
        pending: minJobs - completedJobs,
        message: `Faltam ${
          minJobs - completedJobs
        } trabalhos para atingir o mínimo de ${minJobs}.`,
      });
    }

    // Verificar se passou pelo menos um mês desde a última ativação ou criação da conta
    if (now < oneMonthLater) {
      const daysUntilEligible = Math.ceil(
        (oneMonthLater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      criteria.push({
        name: "Tempo Mínimo Entre Solicitações",
        pending: daysUntilEligible,
        message: `Faltam ${daysUntilEligible} dias para poder ativar novamente o recurso 'Mão Amiga'.`,
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
