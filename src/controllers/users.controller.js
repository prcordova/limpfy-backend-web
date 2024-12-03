const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const path = require("path");

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
      avatar: user.avatar ? `/uploads/${user.avatar}` : null, // Corrige o caminho do avatar
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    console.log("entrou no updateProfile", userId, updates);

    // Se houver um arquivo de avatar, atualize o caminho do avatar
    if (req.file) {
      updates.avatar = path
        .relative(path.join(__dirname, "../../public/uploads"), req.file.path)
        .replace(/\\/g, "/"); // Corrige o caminho para usar barras normais
    }

    // Atualize o endereço se fornecido
    if (updates.address) {
      updates.address = JSON.parse(updates.address);
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Gere um novo token JWT
    const token = jwt.sign(
      { sub: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Armazena o novo token em um cookie
    res.cookie("session-token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      access_token: token,
      role: user.role,
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      birthDate: user.birthDate,
      address: user.address,
      hasAcceptedTerms: user.hasAcceptedTerms,
      termsAcceptedDate: user.termsAcceptedDate,
      workerDetails: user.workerDetails,
      avatar: user.avatar,
    });
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
