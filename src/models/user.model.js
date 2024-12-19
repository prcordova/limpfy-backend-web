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

    // Avaliações e comentários
    ratings: [
      {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
