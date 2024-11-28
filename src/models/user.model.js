const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["client", "worker", "admin"],
    default: "client",
  },
});

module.exports = mongoose.model("User", UserSchema);
