// server.js
require("dotenv").config();
const app = require("./src/app");
const mongoose = require("mongoose");
const http = require("http");
const { configureSocket } = require("./src/socket");

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

// Inicialize o socket aqui.
configureSocket(server);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Conectado ao MongoDB");
    server.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erro ao conectar ao MongoDB:", err);
  });
