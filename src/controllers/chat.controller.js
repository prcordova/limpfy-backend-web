const Job = require("../models/job.model");
const { getIO } = require("../socket");

// Função auxiliar para verificar permissões
const checkChatPermissions = (job, userId, userRole) => {
  const isClient = job.clientId.toString() === userId;
  const isWorker = job.workerId && job.workerId.toString() === userId;
  const isSupport = ["admin", "support", "supportN1"].includes(userRole);

  return {
    canAccess: isClient || isWorker || isSupport,
    role: isClient
      ? "client"
      : isWorker
      ? "worker"
      : isSupport
      ? userRole
      : null,
  };
};

exports.getMessages = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId)
      .populate("clientId", "fullName")
      .populate("workerId", "fullName")
      .populate("supportId", "fullName");

    if (!job) {
      return res.status(404).json({ message: "Conversa não encontrada" });
    }

    const { canAccess } = checkChatPermissions(
      job,
      req.user._id,
      req.user.role
    );
    if (!canAccess) {
      return res
        .status(403)
        .json({ message: "Sem permissão para acessar esta conversa" });
    }

    res.json({
      jobTitle: job.title,
      messages: job.disputeMessages || [],
      participants: {
        client: job.clientId,
        worker: job.workerId,
        support: job.supportId,
      },
      status: {
        job: job.status,
        dispute: job.disputeStatus,
        support: job.supportStatus,
      },
    });
  } catch (err) {
    console.error("Erro ao buscar mensagens:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { message, roleOverride } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Conversa não encontrada" });
    }

    const { canAccess, role } = checkChatPermissions(
      job,
      req.user._id,
      req.user.role
    );
    if (!canAccess) {
      return res
        .status(403)
        .json({ message: "Sem permissão para enviar mensagens" });
    }

    // Permite override de role apenas para admin
    const senderRole =
      req.user.role === "admin" && roleOverride ? roleOverride : role;

    const newMsg = {
      senderId: req.user._id,
      senderRole,
      message,
      senderName: req.user.fullName,
      sentAt: new Date(),
    };

    // Adiciona mensagem ao job
    job.disputeMessages.push(newMsg);
    await job.save();

    // Emite via socket
    const io = getIO();
    io.to(`chat:${jobId}`).emit("chatMessage", {
      jobId,
      ...newMsg,
      text: message, // mantendo compatibilidade com frontend existente
    });

    res.status(201).json(newMsg);
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    res.status(500).json({ message: err.message });
  }
};
