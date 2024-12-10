const Job = require("../models/job.model");
const User = require("../models/user.model");
const { getIO, getConnectedUsers } = require("../socket");

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

exports.getClientJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ clientId: req.user._id });
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      status: { $nin: ["in-progress", "cancelled-by-client"] },
    });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

exports.getJobsByUserId = async (req, res) => {
  try {
    const jobs = await Job.find({ clientId: req.params.userId });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

// Worker endpoints

// exports.acceptJob = async (req, res) => {
//   try {
//     console.log(`Accepting job with ID: ${req.params.id}`);
//     const job = await Job.findById(req.params.id);
//     if (!job) {
//       return res.status(404).json({ message: "Trabalho não encontrado" });
//     }

//     if (job.workerId) {
//       return res
//         .status(400)
//         .json({ message: "Trabalho já aceito por outro trabalhador" });
//     }

//     job.workerId = req.user._id;
//     job.status = "in-progress";
//     await job.save();

//     res.json(job);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };
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

exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ workerId: req.user._id });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
