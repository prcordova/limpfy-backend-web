const mongoose = require("mongoose");
const User = require("../models/user.model");
require("dotenv").config();

(async () => {
  try {
    // Conexão com o MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // ID do usuário a ser atualizado
    const userId = "674e20d0f16176f405cfcaea";

    // Verifica se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("ID inválido.");
      process.exit(1);
    }

    // Tenta encontrar o usuário antes da atualização
    const user = await User.findById(userId);
    if (!user) {
      console.log("Usuário não encontrado.");
      process.exit(1);
    }

    console.log("Usuário encontrado antes da atualização:", user.workerDetails);

    // Atualizar o usuário
    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) }, // Corrigido aqui
      {
        $set: {
          "workerDetails.nextHandsOnThreshold": 20,
          "workerDetails.lastHandsOnActivation": null,
        },
      }
    );

    console.log(
      `Usuário atualizado. Modified count: ${result.modifiedCount}, Matched count: ${result.matchedCount}`
    );
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
  } finally {
    await mongoose.disconnect();
  }
})();
