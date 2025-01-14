const mongoose = require("mongoose");
const User = require("../models/user.model");
require("dotenv").config();

const resetUserTerms = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await User.updateMany(
      {}, // atualiza todos os documentos
      {
        $set: {
          hasAcceptedTerms: false,
          termsAcceptedDate: null,
        },
      }
    );

    console.log(
      `Atualização concluída. ${result.modifiedCount} usuários foram atualizados.`
    );
  } catch (error) {
    console.error("Erro ao executar a migration:", error);
  } finally {
    await mongoose.connection.close();
  }
};

resetUserTerms();
