const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "in-progress",
        "completed",
        "cancelled-by-client",
        "dispute",
        "waiting-for-rating",
      ],
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
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isRated: { type: Boolean, default: false }, // Indica se o cliente já avaliou o trabalho

    workerName: { type: String },

    // Novos campos para fluxo de conclusão
    cleanedPhoto: { type: String }, // Caminho/URL da foto da área limpa após conclusão
    completedAt: { type: Date }, // Data/hora em que o trabalho foi concluído
    disputeUntil: { type: Date }, // Data/hora até quando o cliente pode contestar
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);
