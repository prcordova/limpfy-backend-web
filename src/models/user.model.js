const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    avatars: [
      {
        path: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
    birthDate: { type: Date, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["client", "worker", "admin"],
      default: "client",
    },
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
    hasAcceptedTerms: { type: Boolean, default: false },
    termsAcceptedDate: { type: Date },
    faceVerified: { type: Boolean, default: false },

    notifications: [
      {
        message: { type: String, required: true },
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        type: {
          type: String,
          required: true,
          enum: ["job", "profile", "news"],
          default: "job",
        },
      },
    ],

    ratings: [
      {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    workerDetails: {
      completedJobs: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now },
      handsOnLimit: { type: Number, default: 1 }, // Limite mensal de "Mão Amiga"
      handsOnUsed: {
        type: Number,
        default: 0,
        min: 0, // Garante que não fique negativo
      },
      lastReset: { type: Date, default: Date.now }, // Data do último reset do limite
      handsOnActive: { type: Boolean, default: false }, // Ativo atualmente
      balance: { type: Number, default: 0 }, // Saldo do trabalhador
      lastHandsOnActivation: { type: Date, default: null }, // Data da última ativação
      nextHandsOnThreshold: { type: Number, default: 20 }, // Trabalhos para próxima ativação
    },

    handsOn: {
      isActive: { type: Boolean, default: false },
      subscriptionId: { type: String, default: null },
      activatedAt: { type: Date, default: null },
      nextBillingDate: { type: Date, default: null },
    },
  },
  { timestamps: true } // Inclui createdAt e updatedAt automaticamente
);

// Middleware para garantir consistência em handsOnUsed
UserSchema.pre("save", function (next) {
  if (this.workerDetails.handsOnUsed < 0) {
    this.workerDetails.handsOnUsed = 0;
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
