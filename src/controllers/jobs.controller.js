const Job = require("../models/job.model");
const User = require("../models/user.model");
const Report = require("../models/report.model");

const { getIO, getConnectedUsers } = require("../socket");
const path = require("path");
const fs = require("fs");

exports.createJob = async (req, res) => {
  try {
    const job = new Job({ ...req.body, clientId: req.user._id });
    await job.save();

    res.status(201).json({
      jobId: job._id,
      clientId: job.clientId,
      title: job.title,
      description: job.description,
      workerQuantity: job.workerQuantity,
      price: job.price,
      sizeGarbage: job.sizeGarbage,
      typeOfGarbage: job.typeOfGarbage,
      cleaningType: job.cleaningType,
      measurementUnit: job.measurementUnit,
      location: job.location,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    console.log(`Cancelling order with ID: ${req.params.id}`);
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Você não tem permissão para cancelar este trabalho",
      });
    }

    job.status = "cancelled-by-client";
    await job.save();

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// //busca trabalhos do cliente
// exports.getClientJobs = async (req, res) => {
//   try {
//     // Popula workerId com fullName, avatars, ratings e média (averageRating)
//     // Você precisará criar um virtual ou pipeline de agregação para calcular averageRating,
//     // ou pré-calcular no momento da requisição.
//     // Por simplicidade, supondo que averageRating já exista ou seja calculado no momento da consulta:
//     const jobs = await Job.find({ clientId: req.user._id }).populate({
//       path: "workerId",
//       select: "fullName avatars ratings",
//     });

//     // Calcular averageRating do trabalhador aqui, se necessário:
//     // Ou caso já esteja armazenado no banco, só retornar.
//     // Também pegar últimos 3 comentários já filtrados no front.

//     // Aqui você pode iterar sobre cada job e calcular averageRating se não existir:
//     for (let j of jobs) {
//       if (j.workerId && j.workerId.ratings && j.workerId.ratings.length > 0) {
//         const sum = j.workerId.ratings.reduce((acc, r) => acc + r.rating, 0);
//         const avg = sum / j.workerId.ratings.length;
//         j.workerId.averageRating = avg;
//       } else if (j.workerId) {
//         j.workerId.averageRating = 0;
//       }
//     }

//     res.status(200).json(jobs);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

exports.getClientJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ clientId: req.user._id }).populate(
      "workerId",
      "fullName avatars ratings"
    );

    // Calcular a média de avaliações do trabalhador
    for (const job of jobs) {
      if (
        job.workerId &&
        job.workerId.ratings &&
        job.workerId.ratings.length > 0
      ) {
        const sum = job.workerId.ratings.reduce((acc, r) => acc + r.rating, 0);
        job.workerId.averageRating = sum / job.workerId.ratings.length;
      } else if (job.workerId) {
        job.workerId.averageRating = 0;
      }
    }

    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//busca novos trabalhos na aba todos para trabalhador
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      status: { $nin: ["in-progress", "cancelled-by-client"] },
    }).sort({ status: "desc", createdAt: -1 }); // Prioriza "handsOn" e ordena por data

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

//atualiza trabalho
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Você não tem permissão para editar este trabalho",
      });
    }

    Object.assign(job, req.body);
    await job.save();

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

//reativa trabalho
exports.reactivateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Você não tem permissão para reativar este trabalho",
      });
    }

    job.status = "pending";
    await job.save();

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.completeOrder = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    // Verifica se o usuário logado é o cliente
    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Você não tem permissão para completar este pedido.",
      });
    }

    // Verifica se o status do job é waiting-for-client
    if (job.status !== "waiting-for-client") {
      return res.status(400).json({
        message:
          "A conclusão só pode ser aceita se o trabalho estiver aguardando avaliação.",
      });
    }

    // Busca o trabalhador
    const worker = await User.findById(job.workerId);
    if (!worker) {
      return res
        .status(404)
        .json({ message: "Trabalhador associado não encontrado." });
    }

    // Cálculo do saldo
    const jobPrice = job.price; // Certifique-se de que o preço está armazenado no job
    const platformFee = 0.3; // Taxa de 30% para a plataforma
    let workerEarnings = jobPrice * (1 - platformFee);

    if (worker.workerDetails.handsOnActive) {
      const handsOnDiscount = 0.05; // Desconto adicional de 5%
      workerEarnings *= 1 - handsOnDiscount;
    }

    // Atualiza o saldo do trabalhador
    worker.workerDetails.balance += workerEarnings;

    // Salva o trabalhador atualizado
    await worker.save();

    // Marca o trabalho como concluído
    job.status = "waiting-for-rating";
    job.completedAt = new Date();

    await job.save();

    // Opcional: enviar notificação via socket ou notificação para o trabalhador
    const { getConnectedUsers, getIO } = require("../socket");
    const users = getConnectedUsers();
    const socketId = users[worker._id.toString()];

    if (socketId) {
      const io = getIO();
      io.to(socketId).emit("jobCompleted", {
        message: `O cliente confirmou a conclusão do trabalho "${job.title}".`,
        jobId: job._id,
      });
    }

    res.json({
      message: "Trabalho concluído com sucesso.",
      job,
      updatedBalance: worker.workerDetails.balance,
    });
  } catch (err) {
    console.error("Erro ao completar o pedido:", err);
    res.status(500).json({ message: err.message });
  }
};

// Worker endpoints

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

    if (!job.clientId) {
      return res
        .status(400)
        .json({ message: "Client ID não encontrado no job" });
    }

    // Buscar o cliente no banco
    const client = await User.findById(job.clientId);
    if (!client) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    const clientIdStr = job.clientId.toString();
    const users = getConnectedUsers();
    const socketId = users[clientIdStr];

    // Enviar notificação via Socket.IO se o cliente estiver conectado
    if (socketId) {
      const io = getIO();
      io.to(socketId).emit("jobAccepted", {
        message: `O trabalho "${job.title}" foi aceito e está em andamento.`,
      });
      console.log(
        `📡 Notificação enviada via socket para o cliente com ID: ${clientIdStr}`
      );
    } else {
      console.warn(`⚠️ Cliente ${clientIdStr} não está conectado`);
    }

    // Adicionar notificação no documento do cliente
    client.notifications.push({
      message: `Seu trabalho "${job.title}" foi iniciado.`,
      jobId: job._id,
      workerId: job.workerId.toString(),
      type: "job", // Definindo o tipo de notificação
    });

    await client.save(); // Salvar as alterações no cliente
    await job.save(); // Salvar as alterações no job

    res.json(job);
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
    const jobs = await Job.find({ workerId: req.user._id }).populate(
      "clientId",
      "fullName"
    );

    res.json(jobs);
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

exports.reportCarProblem = async (req, res) => {
  const { id: jobId } = req.params;
  const { description } = req.body; // Pode ser undefined
  const reporterId = req.user._id;

  try {
    // Verificar se o trabalho existe
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado." });
    }

    // Criar um relatório de problema
    const report = new Report({
      jobId,
      clientId: job.clientId,
      reporterId,
      type: "Problema com carro",
      description: description || "Sem descrição fornecida.", // Defina um padrão caso não seja enviado
    });

    await report.save();

    res.status(201).json({
      message: "Problema relatado com sucesso.",
      report,
    });
  } catch (error) {
    console.error("Erro ao relatar problema com carro:", error);
    res.status(500).json({
      message: "Erro ao relatar problema com carro.",
    });
  }
};

exports.openDispute = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ message: "Trabalho não encontrado" });

    // Apenas o cliente que criou o job pode abrir disputa
    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Permissão negada" });
    }

    // Se o job não estiver completed ou in-progress, não faz sentido abrir disputa
    if (job.status !== "waiting-for-client") {
      return res.status(400).json({
        message: "Apenas trabalhos concluídos podem ser disputados",
      });
    }

    job.status = "dispute";
    job.disputeStatus = "open";
    job.disputeReason = req.body.reason || "Sem razão fornecida";
    await job.save();

    // Notificar admin via socket (se desejar) ou via notificação
    // Exemplo: enviar notificação a um admin global - depende da sua lógica.

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

//ADMIN envia mensagem de disputa
exports.sendDisputeMessage = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ message: "Trabalho não encontrado" });

    if (job.status !== "dispute") {
      return res
        .status(400)
        .json({ message: "Este trabalho não está em disputa." });
    }

    // Verifica o role do usuário a partir de req.user.role
    // Apenas admin, cliente (job.clientId) ou trabalhador (job.workerId) podem enviar
    // Mas você pode restringir ainda mais se necessário (por ex, se trabalhador não pode enviar após disputa aberta).
    let senderRole = req.user.role; // 'admin', 'client', 'worker'

    // Cliente só envia se job.clientId === req.user._id
    if (
      senderRole === "client" &&
      job.clientId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Permissão negada" });
    }

    // Trabalhador só envia mensagem se assim for permitido pela lógica (por ex, pode ser bloqueado na disputa)
    if (
      senderRole === "worker" &&
      job.workerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Permissão negada" });
    }

    // Admin pode sempre enviar, assumindo que req.user.role === 'admin'

    job.disputeMessages.push({
      senderId: req.user._id,
      senderRole: senderRole,
      message: req.body.message,
    });

    await job.save();

    // Enviar via socket.io para as partes envolvidas (cliente, trabalhador, admin) se desejado
    // ...

    res.json({ message: "Mensagem enviada", job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

//resolve disputa
exports.resolveDispute = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ message: "Trabalho não encontrado" });

    // Verificar role admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Apenas admin pode resolver disputas" });
    }

    if (job.status !== "dispute" || job.disputeStatus !== "open") {
      return res.status(400).json({ message: "A disputa não está aberta." });
    }

    // Decisão do admin: liberar pagamento ou não
    // Suponha que req.body.action seja "release-payment" ou "refund-client"
    const action = req.body.action;
    if (!action) {
      return res.status(400).json({ message: "Ação não fornecida." });
    }

    job.disputeStatus = "resolved";
    job.status = "completed";
    job.disputeResolvedAt = new Date();

    if (action === "release-payment") {
      job.paymentReleased = true;
      // Lógica de pagamento ao trabalhador...
    } else if (action === "refund-client") {
      job.paymentReleased = false;
      // Lógica de reembolso ao cliente...
    } else {
      return res.status(400).json({ message: "Ação inválida." });
    }

    await job.save();

    // Notificar cliente e trabalhador do resultado via notificação e/ou socket
    // ...

    res.json({ message: "Disputa resolvida com sucesso.", job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

//client rates job after completion
exports.rateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const { rating, comment } = req.body;

    // Buscar o job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    // Verificar se o usuário logado é o cliente
    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Você não tem permissão para avaliar este trabalho.",
      });
    }

    // Verificar se já foi avaliado
    if (job.isRated) {
      return res
        .status(400)
        .json({ message: "Este trabalho já foi avaliado." });
    }

    // Validar nota
    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res
        .status(400)
        .json({ message: "A avaliação deve ser um número entre 1 e 5." });
    }

    // Buscar o trabalhador para gravar a avaliação nele
    if (!job.workerId) {
      return res
        .status(400)
        .json({ message: "Não há um trabalhador associado a este trabalho." });
    }

    const worker = await User.findById(job.workerId);
    if (!worker) {
      return res.status(404).json({ message: "Trabalhador não encontrado." });
    }

    // Adicionar a avaliação ao trabalhador
    worker.ratings.push({
      jobId: job._id,
      rating: parsedRating,
      comment: comment || "",
      createdAt: new Date(),
    });

    await worker.save();

    // Atualizar o job para indicar que foi avaliado e completado
    job.status = "completed";

    // Marcar o job como avaliado
    job.isRated = true;
    await job.save();

    res.json({ message: "Avaliação enviada com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
