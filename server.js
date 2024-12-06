const app = require("./src/app");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Conectado ao MongoDB");
    app.listen(8080 || 4000);
  })
  .catch((err) => {
    console.error("Erro ao conectar ao MongoDB:", err);
  });
