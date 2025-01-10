const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  birthDate: { type: Date, required: true },
  idPhoto: { type: String },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: false, // ou true, dependendo da lógica
  },
  // etc...
});

module.exports = mongoose.model("Worker", WorkerSchema);
