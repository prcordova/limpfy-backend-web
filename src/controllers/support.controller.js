// src/controllers/support.controller.js
const Job = require("../models/job.model");
const User = require("../models/user.model");
const { getIO, getConnectedUsers } = require("../socket");

exports.getSupportChat = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId)
      .populate("clientId", "fullName")
      .populate("workerId", "fullName");

    if (!job) {
      return res.status(404).json({ message: "Job não encontrado." });
    }

    // Se quiser, valide se `req.user` é o client ou worker do job
    // ou um admin que pode ver a disputa.

    // Retorne as mensagens de disputeMessages
    // e algum `jobTitle` (opcional)
    res.json({
      jobTitle: job.title,
      messages: job.disputeMessages || [],
    });
  } catch (err) {
    console.error("Erro ao buscar suporte:", err);
    res.status(500).json({ message: "Erro ao carregar o chat de suporte." });
  }
};

exports.sendSupportMessage = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { message } = req.body;
    const senderId = req.user._id;

    const job = await Job.findById(jobId)
      .populate("clientId", "fullName")
      .populate("workerId", "fullName");

    if (!job) {
      return res.status(404).json({ message: "Job não encontrado." });
    }

    // Se quiser, verifique se o user é admin, ou job.clientId, ou job.workerId, etc.
    // Defina o papel (senderRole) conforme a lógica:
    let senderRole = "client";
    if (req.user.role === "admin") {
      senderRole = "admin";
    } else if (job.workerId && job.workerId.equals(senderId)) {
      senderRole = "worker";
    }

    // Descubra o nome do sender para exibir no front
    let senderName = "Indefinido";
    if (senderRole === "admin") {
      senderName = "Admin";
    } else if (senderRole === "client") {
      senderName = job.clientId?.fullName || "Cliente";
    } else if (senderRole === "worker") {
      senderName = job.workerId?.fullName || "Trabalhador";
    }

    // Adiciona mensagem no array disputeMessages
    const newMessage = {
      senderId,
      senderRole,
      message,
      senderName,
      sentAt: new Date(),
    };
    job.disputeMessages.push(newMessage);

    await job.save();
    const io = getIO();
    const connectedUsers = getConnectedUsers();

    // Se quiser emitir para “todos” os admins conectados, você não tem
    // uma lista de userIds de admins. Então uma abordagem é:
    //   A) cada admin se junta em uma room “admins”.
    //   B) você faz: io.to("admins").emit("disputeMessage", { ... })

    // Exemplo simples: emitir p/ cada userId que seja admin e esteja conectado
    // (Não é muito escalável, mas funciona em um pequeno MVP):
    const admins = Object.keys(connectedUsers); // array de userIds
    admins.forEach((adminUserId) => {
      // Veja se no MongoDB esse user tem role=admin
      // ou mantenha um cache dos user roles
      // ...
      io.to(connectedUsers[adminUserId]).emit("disputeMessage", {
        jobId: job._id,
        senderRole: senderRole,
        text: message,
        sentAt: new Date(),
        senderName,
        senderId: req.user._id,
      });
    });

    // Retorne a nova mensagem para o front
    res.status(201).json({
      ...newMessage,
      senderName,
    });
  } catch (err) {
    console.error("Erro ao enviar mensagem de suporte:", err);
    res.status(500).json({ message: "Erro ao enviar mensagem." });
  }
};
