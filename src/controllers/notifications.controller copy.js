const User = require("../models/user.model");

exports.getUserNotifications = async (req, res) => {
  try {
    // Supondo que você tenha o ID do usuário logado em req.user._id
    const user = await User.findById(req.user._id).select("notifications");
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({ notifications: user.notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUserNotifications = async (req, res) => {
  try {
    // Supondo que você tenha o ID do usuário logado em req.user._id
    const user = await User.findByIdAndUpdate(req.user._id, {
      notifications: [],
    });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({ message: "Notificações excluídas com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
