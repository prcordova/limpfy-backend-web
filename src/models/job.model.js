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
    workerQuantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    sizeGarbage: { type: Number, required: true, min: 0 },
    typeOfGarbage: { type: String, required: true },
    cleaningType: { type: String, required: true },
    measurementUnit: { type: String, required: true },
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

    disputeStatus: { type: String }, // Adicionado para gerenciamento de disputas
    disputeReason: { type: String },
    disputeMessages: [
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        senderRole: { type: String }, // 'admin', 'client', 'worker'
        message: { type: String },
        sentAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Índices para otimizar consultas
JobSchema.index({ clientId: 1 });
JobSchema.index({ workerId: 1 });

// Virtual para calcular a média de avaliações do trabalhador
JobSchema.virtual("workerAverageRating").get(function () {
  if (
    this.workerId &&
    this.workerId.ratings &&
    this.workerId.ratings.length > 0
  ) {
    const sum = this.workerId.ratings.reduce((acc, r) => acc + r.rating, 0);
    return sum / this.workerId.ratings.length;
  }
  return 0;
});

// Pre-save hook para garantir a consistência dos dados
JobSchema.pre("save", function (next) {
  if (this.isModified("price") && this.price < 0) {
    return next(new Error("Preço não pode ser negativo."));
  }
  if (this.isModified("workerQuantity") && this.workerQuantity < 1) {
    return next(
      new Error("A quantidade de trabalhadores deve ser pelo menos 1.")
    );
  }
  next();
});

module.exports = mongoose.model("Job", JobSchema);
