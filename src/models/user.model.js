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

    // Agora aceitamos 'support' também
    role: {
      type: String,
      enum: ["client", "worker", "support", "admin", "supportN1"],
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

    // Avaliações que este usuário (como worker) recebeu
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

      // Mão Amiga
      handsOnLimit: { type: Number, default: 1 }, // Limite mensal
      handsOnUsed: { type: Number, default: 0, min: 0 },
      lastReset: { type: Date, default: Date.now },
      handsOnActive: { type: Boolean, default: false },
      balance: { type: Number, default: 0 },
      lastHandsOnActivation: { type: Date, default: null },
      nextHandsOnThreshold: { type: Number, default: 20 },
    },

    // Se quiser manter também um objeto 'handsOn' adicional
    handsOn: {
      isActive: { type: Boolean, default: false },
      subscriptionId: { type: String, default: null },
      activatedAt: { type: Date, default: null },
      nextBillingDate: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Middleware para garantir consistência em handsOnUsed
UserSchema.pre("save", function (next) {
  if (this.workerDetails && this.workerDetails.handsOnUsed < 0) {
    this.workerDetails.handsOnUsed = 0;
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
