const Job = require("../models/job.model");
const { getConnectedUsers, getIO } = require("../socket");
const User = require("../models/user.model");

// Função auxiliar para verificar se o usuário tem permissão de suporte
const hasSupportAccess = (role) => {
  return ["admin", "support", "supportN1"].includes(role);
};

exports.sendTicketMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    if (job.status !== "dispute") {
      return res
        .status(400)
        .json({ message: "Este trabalho não está em modo de disputa." });
    }

    let senderRole = req.user.role;

    // Verifica permissões para client e worker
    if (
      senderRole === "client" &&
      job.clientId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Permissão negada" });
    }

    if (
      senderRole === "worker" &&
      job.workerId &&
      job.workerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Permissão negada" });
    }

    // Permite override apenas para admin
    let roleOverride = req.body.roleOverride;
    if (senderRole === "admin" && roleOverride) {
      senderRole = roleOverride;
    }

    const newMsg = {
      senderId: req.user._id,
      senderRole: senderRole,
      message: req.body.message,
      sentAt: new Date(),
      senderName: req.user.fullName,
    };

    job.disputeMessages.push(newMsg);
    await job.save();

    // Socket logic
    const io = getIO();

    // Emite para a sala específica do ticket/job
    io.to(`dispute:${id}`).emit("disputeMessage", {
      jobId: job._id,
      text: req.body.message,
      senderId: req.user._id,
      senderRole: senderRole,
      sentAt: newMsg.sentAt,
      senderName: req.user.fullName,
    });

    res.json({ message: "Mensagem enviada", job });
  } catch (err) {
    console.error("Erro ao enviar mensagem de ticket:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.resolveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    // Mantém a restrição de resolução apenas para admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Apenas admin pode resolver tickets" });
    }

    if (job.status !== "dispute" || job.disputeStatus !== "open") {
      return res.status(400).json({
        message:
          "O ticket não está aberto ou o Job não está em status 'dispute'.",
      });
    }

    const action = req.body.action;
    if (!action) {
      return res.status(400).json({ message: "Ação não fornecida (action)." });
    }

    job.disputeStatus = "resolved";
    job.status = "completed";
    job.disputeResolvedAt = new Date();

    if (action === "release-payment") {
      job.paymentReleased = true;
    } else if (action === "refund-client") {
      job.paymentReleased = false;
    } else if (action === "claim-invalid") {
      job.paymentReleased = false;
    } else {
      return res.status(400).json({ message: "Ação inválida." });
    }

    await job.save();
    res.json({ message: "Ticket resolvido com sucesso.", job });
  } catch (err) {
    console.error("Erro ao resolver ticket:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    if (!hasSupportAccess(req.user.role)) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    const { status, assignedTo } = req.query;
    const query = {
      status: "dispute",
      disputeStatus: { $ne: "resolved" }, // Não mostrar tickets resolvidos por padrão
    };

    // Filtrar por status do suporte
    if (status) {
      query.supportStatus = status;
    }

    // Filtrar por tickets atribuídos ao usuário atual
    if (assignedTo === "me") {
      query.supportId = req.user._id;
    }

    const docs = await Job.find(query)
      .populate("clientId", "fullName email")
      .populate("workerId", "fullName email")
      .populate("supportId", "fullName email");

    const tickets = [];

    for (const doc of docs) {
      let adjustedPrice = null;
      if (doc.workerId) {
        const worker = await User.findById(doc.workerId);
        if (worker) {
          const platformFee = 0.3;
          const discount = worker.workerDetails.handsOnActive ? 0.05 : 0;
          adjustedPrice = doc.price * (1 - platformFee) * (1 - discount);
        }
      }

      tickets.push({
        ...doc.toObject(),
        adjustedPrice,
      });
    }

    return res.status(200).json({ tickets });
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    res.status(500).json({ message: "Erro ao buscar tickets." });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    // Permite acesso para supportN1
    if (!hasSupportAccess(req.user.role)) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    const { id } = req.params;
    const job = await Job.findById(id)
      .populate("clientId", "fullName email")
      .populate("workerId", "fullName email");

    if (!job) {
      return res.status(404).json({ message: "Ticket não encontrado." });
    }

    let adjustedPrice = null;
    if (job.workerId) {
      const worker = await User.findById(job.workerId);
      if (worker) {
        const platformFee = 0.3;
        const discount = worker.workerDetails.handsOnActive ? 0.05 : 0;
        adjustedPrice = job.price * (1 - platformFee) * (1 - discount);
      }
    }

    const ticket = {
      ...job.toObject(),
      adjustedPrice,
    };

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("Erro ao buscar ticket por ID:", error);
    return res.status(500).json({ message: "Erro ao buscar ticket." });
  }
};

// Função para atender ticket
exports.assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const supportId = req.user._id;

    // Verifica se o usuário tem permissão de suporte
    if (!hasSupportAccess(req.user.role)) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    const ticket = await Job.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    // Verifica se o ticket já está sendo atendido
    if (ticket.supportId && ticket.supportStatus === "in-progress") {
      const supportUser = await User.findById(ticket.supportId);
      return res.status(400).json({
        message: `Ticket já está sendo atendido por ${supportUser.fullName}`,
      });
    }

    // Atualiza o ticket com as informações do suporte
    ticket.supportId = supportId;
    ticket.supportStatus = "in-progress";
    ticket.supportAssignedAt = new Date();
    ticket.disputeStatus = "in-progress"; // Atualiza o status da disputa também

    await ticket.save();

    res.status(200).json({
      message: "Ticket atribuído com sucesso",
      ticket,
    });
  } catch (error) {
    console.error("Erro ao atribuir ticket:", error);
    res.status(500).json({
      message: "Erro ao atribuir ticket.",
      error: error.message,
    });
  }
};

exports.unassignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const ticket = await Job.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    // Verifica se o ticket está atribuído ao usuário atual
    if (
      !ticket.supportId ||
      ticket.supportId.toString() !== currentUserId.toString()
    ) {
      return res.status(403).json({
        message:
          "Você não pode desatribuir um ticket que não está atribuído a você",
      });
    }

    // Reseta as informações de suporte
    ticket.supportId = null;
    ticket.supportStatus = "pending";
    ticket.disputeStatus = "open";
    ticket.supportAssignedAt = null;

    await ticket.save();

    res.status(200).json({
      message: "Ticket desatribuído com sucesso",
      ticket,
    });
  } catch (error) {
    console.error("Erro ao desatribuir ticket:", error);
    res.status(500).json({ message: "Erro ao desatribuir ticket." });
  }
};
