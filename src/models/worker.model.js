const WorkerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  emailOrPhone: { type: String, required: true, unique: true },
  cpf: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  birthDate: { type: Date, required: true },
  address: {
    cep: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    number: { type: String, required: true },
    complement: { type: String },
    reference: { type: String },
  },
  idPhoto: { type: String },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["worker"],
    default: "worker",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true, // Trabalhadores sempre pertencem a uma empresa
  },
});

module.exports = mongoose.model("Worker", WorkerSchema);
