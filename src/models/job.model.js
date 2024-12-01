const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "cancelled-by-client"],
    default: "pending",
  },
  workerQuantity: { type: Number, required: true },
  price: { type: Number, required: true },
  sizeGarbage: { type: Number, required: true },
  location: {
    cep: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    number: { type: String, required: true },
    complement: { type: String },
    reference: { type: String },
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", JobSchema);
