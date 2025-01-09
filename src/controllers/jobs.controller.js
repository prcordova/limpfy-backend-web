const Job = require("../models/job.model");
const User = require("../models/user.model");

const { getIO, getConnectedUsers } = require("../socket");
const path = require("path");
const fs = require("fs");

const calculateAdjustedPrice = (job, handsOnActive) => {
  const platformFee = 0.3; // Taxa de 30% para a plataforma
  const handsOnDiscount = handsOnActive ? 0.05 : 0; // 5% de desconto adicional se "Mão Amiga" estiver ativo
  return (job.price * (1 - platformFee) * (1 - handsOnDiscount)).toFixed(2);
};

//busca novos trabalhos na aba todos para trabalhador
exports.getJobs = async (req, res) => {
  try {
    // Buscar todos os trabalhos disponíveis (não em progresso ou cancelados)
    const jobs = await Job.find({
      status: { $nin: ["in-progress", "cancelled-by-client"] },
    }).sort({ status: "desc", createdAt: -1 });

    // Obter o trabalhador logado
    const worker = await User.findById(req.user._id);
    if (!worker) {
      return res.status(404).json({ message: "Trabalhador não encontrado." });
    }

    // Verificar se o trabalhador possui "Mão Amiga" ativo
    const handsOnActive = worker.workerDetails.handsOnActive;

    // Mapear os trabalhos para incluir o preço ajustado
    const jobsWithAdjustedPrice = jobs.map((job) => {
      const platformFee = 0.3; // Taxa de 30% para a plataforma
      const handsOnDiscount = handsOnActive ? 0.05 : 0; // 5% de desconto adicional se "Mão Amiga" estiver ativo

      // Calcular o preço ajustado
      const adjustedPrice =
        job.price * (1 - platformFee) * (1 - handsOnDiscount);

      return {
        ...job.toObject(),
        adjustedPrice: adjustedPrice.toFixed(2), // Formatar para duas casas decimais
      };
    });

    res.json(jobsWithAdjustedPrice);
  } catch (err) {
    console.error("Erro ao buscar trabalhos:", err);
    res.status(500).json({ message: "Erro ao buscar trabalhos." });
  }
};

//busca trabalho por id
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//busca trabalhos por id do cliente
exports.getJobsByUserId = async (req, res) => {
  try {
    const jobs = await Job.find({ clientId: req.params.userId });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    if (job.workerId) {
      return res
        .status(400)
        .json({ message: "Trabalho já aceito por outro trabalhador" });
    }

    job.workerId = req.user._id;
    job.status = "in-progress";

    const worker = await User.findById(req.user._id);
    if (!worker) {
      return res.status(404).json({ message: "Trabalhador não encontrado." });
    }

    const adjustedPrice = calculateAdjustedPrice(
      job,
      worker.workerDetails.handsOnActive
    );

    // Notificar cliente e salvar alterações
    const client = await User.findById(job.clientId);
    if (client) {
      const { getConnectedUsers, getIO } = require("../socket");
      const users = getConnectedUsers();
      const socketId = users[client._id.toString()];
      if (socketId) {
        const io = getIO();
        io.to(socketId).emit("jobAccepted", {
          message: `O trabalho "${job.title}" foi aceito e está em andamento.`,
        });
      }
    }

    await job.save();
    res.json({ ...job.toObject(), adjustedPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.cancelJob = async (req, res) => {
  try {
    console.log(`Cancelling job with ID: ${req.params.id}`);
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    job.workerId = null;
    job.status = "pending";
    await job.save();

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

//Busca trabalhos do trabalhador

exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ workerId: req.user._id });
    const worker = await User.findById(req.user._id);

    const jobsWithAdjustedPrice = jobs.map((job) => ({
      ...job.toObject(),
      adjustedPrice: calculateAdjustedPrice(
        job,
        worker.workerDetails.handsOnActive
      ),
    }));

    res.json(jobsWithAdjustedPrice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//trabalho completo // Trabalhador concluindo trabalho :

// exports.completeJob = async (req, res) => {
//   console.log("Completing job with ID:", req.params.id);
//   try {
//     const job = await Job.findById(req.params.id);
//     if (!job) {
//       return res.status(404).json({ message: "Trabalho não encontrado" });
//     }

//     // Verifica se o usuário logado é o trabalhador do job
//     if (!job.workerId || job.workerId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         message: "Você não tem permissão para concluir este trabalho",
//       });
//     }

//     // Se já estiver concluído ou cancelado
//     if (["completed", "cancelled-by-client"].includes(job.status)) {
//       return res
//         .status(400)
//         .json({ message: "Trabalho já finalizado ou cancelado" });
//     }

//     // Processa a foto enviada, se existir
//     let cleanedPhoto = null;
//     if (req.file) {
//       const jobId = req.params.id;
//       cleanedPhoto = `/uploads/jobs/${jobId}/cleans/${req.file.filename}`;
//     }

//     // Atualiza o status para `waiting-for-client` e define o tempo para contestação

//     job.status = "waiting-for-client";
//     job.completedAt = new Date();
//     job.cleanedPhoto = cleanedPhoto;
//     job.disputeUntil = new Date(Date.now() + 30 * 60000); // 60 minutos para contestação;
//     await job.save();

//     // Notifica o cliente sobre a conclusão do trabalho via socket ou notificações
//     const clientIdStr = job.clientId.toString();
//     const { getConnectedUsers, getIO } = require("../socket");
//     const users = getConnectedUsers();
//     const socketId = users[clientIdStr];

//     if (socketId) {
//       const io = getIO();
//       io.to(socketId).emit("jobCompleted", {
//         message: `O trabalhador concluiu o trabalho "${job.title}". Avalie e aprove ou abra uma reclamação.`,
//         jobId: job._id,
//         disputeUntil: disputeUntil.toISOString(),
//       });
//     }

//     return res.json({
//       message: "Trabalho concluído. Aguardando aprovação do cliente.",
//       job: {
//         ...job.toObject(),
//         disputeUntilMinutes: Math.ceil((disputeUntil - Date.now()) / 1000 / 60), // Minutos restantes para contestação
//       },
//     });
//   } catch (err) {
//     console.error("Error completing job:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };

exports.completeJob = async (req, res) => {
  console.log("Completing job with ID:", req.params.id);
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    // Verifica se o usuário logado é o trabalhador do job
    if (!job.workerId || job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Você não tem permissão para concluir este trabalho",
      });
    }

    // Se já estiver concluído ou cancelado
    if (["completed", "cancelled-by-client"].includes(job.status)) {
      return res
        .status(400)
        .json({ message: "Trabalho já finalizado ou cancelado" });
    }

    // Processa a foto enviada, se existir
    let cleanedPhoto = null;
    if (req.file) {
      const jobId = req.params.id;
      cleanedPhoto = `/uploads/jobs/${jobId}/cleans/${req.file.filename}`;
    }

    // Atualiza o status para `waiting-for-client` e define o tempo para contestação
    job.status = "waiting-for-client";
    job.completedAt = new Date();
    job.cleanedPhoto = cleanedPhoto;
    job.disputeUntil = new Date(Date.now() + 30 * 60000); // 60 minutos para contestação
    await job.save();

    // Busca o trabalhador
    const worker = await User.findById(req.user._id);
    if (!worker) {
      return res.status(404).json({ message: "Trabalhador não encontrado." });
    }
    // Incrementa trabalhos concluídos
    worker.workerDetails.completedJobs += 1;

    // Aplica desconto do "Mão Amiga" se ativo
    if (worker.workerDetails.handsOnActive) {
      const discount = 5; // Valor do desconto
      worker.workerDetails.balance -= discount;

      // Desativa o recurso se o saldo for insuficiente
      if (worker.workerDetails.balance < 0) {
        worker.workerDetails.handsOnActive = false;
      }
    }

    await worker.save();

    // Notifica o cliente sobre a conclusão do trabalho via socket ou notificações
    const clientIdStr = job.clientId.toString();
    const { getConnectedUsers, getIO } = require("../socket");
    const users = getConnectedUsers();
    const socketId = users[clientIdStr];

    if (socketId) {
      const io = getIO();
      io.to(socketId).emit("jobCompleted", {
        message: `O trabalhador concluiu o trabalho "${job.title}". Avalie e aprove ou abra uma reclamação.`,
        jobId: job._id,
        disputeUntil: job.disputeUntil.toISOString(),
      });
    }

    return res.json({
      message: "Trabalho concluído. Aguardando aprovação do cliente.",
      job: {
        ...job.toObject(),
        disputeUntilMinutes: Math.ceil(
          (job.disputeUntil - Date.now()) / 1000 / 60
        ), // Minutos restantes para contestação
      },
    });
  } catch (err) {
    console.error("Error completing job:", err);
    return res.status(500).json({ message: err.message });
  }
};
