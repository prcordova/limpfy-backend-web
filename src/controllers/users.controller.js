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
    console.log("Buscando usuário com ID:", req.params.id); // Adiciona log para verificar o ID do usuário
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
      avatar: user.avatar,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // Se houver um arquivo de avatar, atualize o caminho do avatar
    if (req.file) {
      updates.avatar = path.relative(
        path.join(__dirname, "../../public"),
        req.file.path
      );
    }

    // Atualize o endereço se fornecido
    if (updates.address) {
      updates.address = JSON.parse(updates.address);
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Error updating profile." });
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
