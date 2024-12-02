const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
    birthDate: { type: Date, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["client", "worker"], default: "client" },
    address: {
      cep: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      number: { type: String, required: true },
      complement: { type: String },
      reference: { type: String },
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
