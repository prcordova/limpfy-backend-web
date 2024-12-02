const User = require("../models/user.model");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json({
      fullName: user.fullName,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      birthDate: user.birthDate,
      address: user.address,
      workerDetails: user.workerDetails,
      hasAcceptedTerms: user.hasAcceptedTerms,
      termsAcceptedDate: user.termsAcceptedDate,
      faceVerified: user.faceVerified,
      role: user.role,
      status: user.status,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptTerms = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Updating terms for user: ${userId}`);
    const user = await User.findByIdAndUpdate(
      userId,
      {
        hasAcceptedTerms: true,
        termsAcceptedDate: new Date(),
      },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json({
      message: "Terms accepted successfully.",
      hasAcceptedTerms: user.hasAcceptedTerms,
      termsAcceptedDate: user.termsAcceptedDate,
    });
  } catch (err) {
    console.error("Error accepting terms:", err);
    res.status(500).json({ message: "Error accepting terms." });
  }
};

exports.verifyFace = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndUpdate(userId, { faceVerified: true });
    res.json({ message: "Face verified successfully." });
  } catch (err) {
    res.status(500).json({ message: "Error verifying face." });
  }
};
