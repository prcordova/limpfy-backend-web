const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  emailOrPhone: { type: String, required: true, unique: true },
  cpf: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
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
