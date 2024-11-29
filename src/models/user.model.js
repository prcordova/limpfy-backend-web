const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  emailOrPhone: { type: String, required: true, unique: true },
  cpf: { type: String, required: true, unique: true },
  birthDate: { type: Date, required: true },
  cep: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  number: { type: String, required: true },
  complement: { type: String },
  reference: { type: String },
  avatar: { type: String },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["client", "worker", "admin"],
    default: "client",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

module.exports = mongoose.model("User", UserSchema);
