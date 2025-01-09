const Job = require("../models/job.model");
const User = require("../models/user.model");
const { getIO, getConnectedUsers } = require("../socket");

exports.createOrder = async (req, res) => {
  try {
    const order = new Job({ ...req.body, clientId: req.user._id });
    await order.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getClientOrders = async (req, res) => {
  try {
    const orders = await Job.find({ clientId: req.user._id }).populate(
      "workerId",
      "fullName avatars ratings"
    );

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Job.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({
          message:
            "Não é possivel cancelar esse pedido, pois ele já está em andamento.",
        });
    }

    if (order.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Você não tem permissão para cancelar esta ordem.",
      });
    }

    order.status = "cancelled-by-client";
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//atualiza trabalho
exports.updateOrder = async (req, res) => {
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

exports.openDisputeOrder = async (req, res) => {
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

exports.completeOrder = async (req, res) => {
  try {
    const order = await Job.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Ordem não encontrada." });
    }

    if (order.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Você não tem permissão para completar esta ordem.",
      });
    }

    order.status = "completed";
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//client rates job after completion
exports.rateOrder = async (req, res) => {
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
