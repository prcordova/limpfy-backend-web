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
        "waiting-for-client",
        "handsOn",
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

    // Se o cliente avaliou este job
    isRated: { type: Boolean, default: false },
    workerName: { type: String },

    // Conclusão
    cleanedPhoto: { type: String },
    completedAt: { type: Date },
    disputeUntil: { type: Date },

    // Disputa
    disputeStatus: {
      type: String,
      enum: ["open", "pending", "in-progress", "resolved"],
      default: "open",
    },
    disputeReason: { type: String },
    disputeMessages: [
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        senderRole: { type: String },
        message: { type: String },
        sentAt: { type: Date, default: Date.now },
      },
    ],

    // Histórico de “resoluções”
    conclusions: [
      {
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        resolutionType: {
          type: String,
          enum: ["release-payment", "refund-client", "claim-invalid", "other"],
        },
        notes: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Pagamento
    paymentIntentId: { type: String }, // se usar Stripe
    paymentReleased: { type: Boolean, default: false },
    paymentMethod: { type: String }, // 'stripe', 'pix', etc.

    // Novos campos para suporte
    supportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    supportAssignedAt: { type: Date },
    supportStatus: {
      type: String,
      enum: ["pending", "in-progress", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Índices
JobSchema.index({ cleanedPhoto: 1 });
JobSchema.index({ clientId: 1 });
JobSchema.index({ workerId: 1 });

// Virtual de exemplo
JobSchema.virtual("workerAverageRating").get(function () {
  // se quisesse puxar do workerId
  // ...
  return 0;
});

// Pre-save
JobSchema.pre("save", function (next) {
  if (this.isModified("price") && this.price < 0) {
    return next(new Error("Preço não pode ser negativo."));
  }
  if (this.isModified("workerQuantity") && this.workerQuantity < 1) {
    return next(
      new Error("Quantidade de trabalhadores deve ser pelo menos 1.")
    );
  }
  next();
});

module.exports = mongoose.model("Job", JobSchema);
