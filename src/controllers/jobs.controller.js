const Job = require("../models/job.model");

exports.createJob = async (req, res) => {
  try {
    const job = new Job({ ...req.body, clientId: req.user.sub });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
