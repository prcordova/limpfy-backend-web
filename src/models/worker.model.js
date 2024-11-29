const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Relaciona com o modelo User
  birthDate: { type: Date, required: true },
  idPhoto: { type: String }, // Foto de identidade
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true, // Trabalhadores sempre pertencem a uma empresa
  },
});

module.exports = mongoose.model("Worker", WorkerSchema);
