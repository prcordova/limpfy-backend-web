const Job = require("../models/job.model");

exports.createJob = async (req, res) => {
  try {
    const job = new Job({ ...req.body, clientId: req.user.sub });
    await job.save();

    res.status(201).json({
      jobId: job._id,
      ...req.body,
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

    if (job.clientId.toString() !== req.user.sub) {
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

// exports.getAllJobs = async (req, res) => {
//   try {
//     const jobs = await Job.find();
//     res.json(jobs);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

exports.getClientJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ clientId: req.user.sub }).sort({
      createdAt: -1,
    });
    res.json(jobs);
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

    if (job.clientId.toString() !== req.user.sub) {
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

    if (job.clientId.toString() !== req.user.sub) {
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

//Worker endpoints

exports.acceptJob = async (req, res) => {
  try {
    console.log(`Accepting job with ID: ${req.params.id}`);
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }

    if (job.workerId) {
      return res
        .status(400)
        .json({ message: "Trabalho já aceito por outro trabalhador" });
    }

    job.workerId = req.user.sub;
    job.status = "in-progress";
    await job.save();

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
    const jobs = await Job.find({ workerId: req.user.sub });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
