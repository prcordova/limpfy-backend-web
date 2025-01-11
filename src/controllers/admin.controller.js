// src/controllers/admin.controller.js

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Job = require("../models/job.model");
const User = require("../models/user.model");
const { getConnectedUsers, getIO } = require("../socket");

// ----------------------------------------------------------------------------
// Exemplo de endpoint para consultar saldo no Stripe
// ----------------------------------------------------------------------------
exports.getStripeBalance = async (req, res) => {
  try {
    // Verificar se o usuário logado é admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado" });
    }

    // Busca o saldo total do Stripe
    const balance = await stripe.balance.retrieve();

    res.status(200).json({
      balance: {
        available: balance.available.map((b) => ({
          amount: b.amount / 100, // Converte de centavos para unidade monetária
          currency: b.currency.toUpperCase(),
        })),
        pending: balance.pending.map((b) => ({
          amount: b.amount / 100,
          currency: b.currency.toUpperCase(),
        })),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar saldo do Stripe:", error);
    res.status(500).json({ message: "Erro ao buscar saldo do Stripe." });
  }
};

// ----------------------------------------------------------------------------
// ADMIN envia mensagem de disputa
// ----------------------------------------------------------------------------
// Exemplo de função corrigida
exports.sendDisputeMessage = async (req, res) => {
  try {
    const { id } = req.params; // ID do Job
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    if (job.status !== "dispute") {
      return res
        .status(400)
        .json({ message: "Este trabalho não está em modo de disputa." });
    }

    // Verifica o role do usuário: 'admin', 'client', 'worker'
    let senderRole = req.user.role;

    // Se for 'client', precisa ser o clientId do Job
    if (
      senderRole === "client" &&
      job.clientId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Permissão negada" });
    }

    // Se for 'worker', precisa ser o workerId do Job
    if (
      senderRole === "worker" &&
      job.workerId &&
      job.workerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Permissão negada" });
    }

    // Se for admin e tiver roleOverride (p.ex. "client" ou "worker"), faz override
    let roleOverride = req.body.roleOverride; // 'client' | 'worker'
    if (senderRole === "admin" && roleOverride) {
      senderRole = roleOverride;
    }

    // Criamos o objeto da nova mensagem com data real
    const newMsg = {
      senderId: req.user._id,
      senderRole: senderRole, // 'admin', 'client', 'worker'
      message: req.body.message,
      sentAt: new Date(), // data/hora real
      senderName: req.user.fullName, // Atenção a digitação
    };

    // Adiciona ao array
    job.disputeMessages.push(newMsg);
    await job.save();

    // Emite no socket
    const io = getIO();
    const connectedUsers = getConnectedUsers();

    const clientUserId = job.clientId?.toString();
    const workerUserId = job.workerId?.toString();

    // Se o ADMIN enviou "como client" e o CLIENTE estiver conectado, envia p/ ele
    if (
      roleOverride === "client" &&
      clientUserId &&
      connectedUsers[clientUserId]
    ) {
      io.to(connectedUsers[clientUserId]).emit("disputeMessage", {
        jobId: job._id,
        senderRole: "admin",
        text: req.body.message,
        senderId: req.user._id,
        sentAt: newMsg.sentAt, // Certifique-se de que isto está definido
        senderName: req.user.fullName,
      });
    }

    // Se o ADMIN enviou "como worker" e o WORKER estiver conectado, envia p/ ele
    if (
      roleOverride === "worker" &&
      workerUserId &&
      connectedUsers[workerUserId]
    ) {
      io.to(connectedUsers[workerUserId]).emit("disputeMessage", {
        jobId: job._id,
        senderRole: "admin",
        text: req.body.message,
        senderId: req.user._id,
        sentAt: newMsg.sentAt, // Corrigido
        senderName: req.user.fullName, // Corrigido
      });
    }

    // Retorna
    res.json({ message: "Mensagem enviada", job });
  } catch (err) {
    console.error("Erro ao enviar mensagem de disputa:", err);
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------------------------------------------------------
// ADMIN resolve disputa
// ----------------------------------------------------------------------------
exports.resolveDispute = async (req, res) => {
  try {
    const { id } = req.params; // ID do Job
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    // Verificar role admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Apenas admin pode resolver disputas" });
    }

    if (job.status !== "dispute" || job.disputeStatus !== "open") {
      return res.status(400).json({
        message:
          "A disputa não está aberta ou o Job não está em status 'dispute'.",
      });
    }

    // Decisão do admin: "release-payment", "refund-client", etc.
    const action = req.body.action;
    if (!action) {
      return res.status(400).json({ message: "Ação não fornecida (action)." });
    }

    // Marca a disputa como resolvida
    job.disputeStatus = "resolved";
    job.status = "completed";
    job.disputeResolvedAt = new Date();

    // Se for "release-payment" => job.paymentReleased = true
    if (action === "release-payment") {
      job.paymentReleased = true;
      // Ex.: job.paymentReleasedAt = new Date() (se precisar)
      // Exemplo: se quiser transferir o saldo para o worker, etc.
    } else if (action === "refund-client") {
      job.paymentReleased = false;
      // Lógica de reembolso ao cliente
    } else if (action === "claim-invalid") {
      // Caso queira uma ação específica de "invalidação" da reclamação
      // Definir job.paymentReleased = true ou false, conforme sua regra
      job.paymentReleased = false; // Por exemplo
    } else {
      return res.status(400).json({ message: "Ação inválida." });
    }

    await job.save();

    // Notificar cliente e trabalhador do resultado via notificação e/ou socket
    // ...
    res.json({ message: "Disputa resolvida com sucesso.", job });
  } catch (err) {
    console.error("Erro ao resolver disputa:", err);
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------------------------------------------------------
// ADMIN lista todas as disputas
// ----------------------------------------------------------------------------
exports.getDisputes = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado." });
    }

    // Buscar todos os trabalhos em status "dispute"
    const docs = await Job.find({ status: "dispute" })
      .populate("clientId", "fullName email")
      .populate("workerId", "fullName email");

    const disputes = [];

    // Exemplo de cálculo do adjustedPrice
    for (const doc of docs) {
      let adjustedPrice = null;
      if (doc.workerId) {
        const worker = await User.findById(doc.workerId);
        if (worker) {
          const platformFee = 0.3; // 30%
          const discount = worker.workerDetails.handsOnActive ? 0.05 : 0; // 5% se Mão Amiga
          adjustedPrice = doc.price * (1 - platformFee) * (1 - discount);
        }
      }

      disputes.push({
        ...doc.toObject(),
        adjustedPrice,
      });
    }

    return res.status(200).json({ disputes });
  } catch (error) {
    console.error("Erro ao buscar disputas:", error);
    res.status(500).json({ message: "Erro ao buscar disputas." });
  }
};

// ----------------------------------------------------------------------------
// ADMIN obtém detalhes de uma disputa específica
// ----------------------------------------------------------------------------
exports.getDisputeById = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado." });
    }

    const { id } = req.params; // ID do Job

    // Buscar o Job (se quiser obrigar estar em status dispute, use um findOne com status: 'dispute')
    const job = await Job.findById(id)
      .populate("clientId", "fullName email")
      .populate("workerId", "fullName email");

    if (!job) {
      return res.status(404).json({ message: "Disputa não encontrada." });
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

    const dispute = {
      ...job.toObject(),
      adjustedPrice,
    };

    return res.status(200).json({ dispute });
  } catch (error) {
    console.error("Erro ao buscar disputa por ID:", error);
    return res.status(500).json({ message: "Erro ao buscar disputa." });
  }
};
