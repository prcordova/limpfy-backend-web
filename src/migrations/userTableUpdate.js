const User = require("../models/user.model"); // Altere o caminho se necessário

(async () => {
  try {
    const users = await User.updateMany(
      { "workerDetails.nextHandsOnThreshold": { $exists: false } },
      {
        $set: {
          "workerDetails.nextHandsOnThreshold": 10,
          "workerDetails.lastHandsOnActivation": null,
        },
      }
    );
    console.log(`Atualizados ${users.modifiedCount} usuários.`);
  } catch (error) {
    console.error("Erro ao atualizar usuários:", error);
  }
})();
