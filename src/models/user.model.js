const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  cpf: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  birthDate: { type: Date, required: true },
  password: { type: String, required: true },
  address: {
    cep: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    number: { type: String, required: true },
    complement: { type: String },
    reference: { type: String },
  },

  role: {
    type: String,
    enum: ["worker", "client", "admin"],
    default: "client",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  // Campos específicos para trabalhadores
  workerDetails: {
    birthDate: { type: Date }, // Data de nascimento
    idPhoto: { type: String }, // Foto de identidade (URL ou base64)
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" }, // Empresa associada
  },
});

module.exports = mongoose.model("User", UserSchema);
