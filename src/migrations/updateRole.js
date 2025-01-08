const mongoose = require("mongoose");
const User = require("./models/user.model"); // Certifique-se de usar o caminho correto para o seu modelo
require("dotenv").config();

(async () => {
  try {
    // Conecte-se ao MongoDB usando o valor de MONGO_URI no .env
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado ao MongoDB");

    // Atualizar o role do usuário
    const userId = "677df7f0ad3a4cf4e0ef46d6";
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: "admin" },
      { new: true } // Retorna o documento atualizado
    );

    if (updatedUser) {
      console.log("Usuário atualizado com sucesso:", updatedUser);
    } else {
      console.log("Usuário não encontrado.");
    }

    // Fechar a conexão com o MongoDB
    mongoose.connection.close();
  } catch (error) {
    console.error("Erro ao atualizar o usuário:", error);
    mongoose.connection.close();
  }
})();
