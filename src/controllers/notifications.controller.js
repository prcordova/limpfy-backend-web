const User = require("../models/user.model");

exports.getUserNotifications = async (req, res) => {
  try {
    console.log("Buscando notificações para usuário:", req.params.id);

    // Buscar usuário com suas notificações
    const user = await User.findById(req.params.id)
      .select("notifications")
      .lean();

    if (!user) {
      console.log("Usuário não encontrado");
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    console.log("Notificações encontradas:", user.notifications);

    // Ordenar notificações por data de criação (mais recentes primeiro)
    const sortedNotifications = user.notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ notifications: sortedNotifications });
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
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

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { userId, notificationId } = req.params;

    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        "notifications._id": notificationId,
      },
      {
        $set: {
          "notifications.$.read": true,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Notificação não encontrada" });
    }

    res.json({ message: "Notificação marcada como lida" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
