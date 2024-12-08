const app = require("./src/app");
const mongoose = require("mongoose");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 8080;

// Crie o servidor HTTP
const server = http.createServer(app);

// Configure o Socket.IO para usar o servidor HTTP
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const connectedUsers = {}; // Objeto para armazenar mapeamento de userId para socketId

io.on("connection", (socket) => {
  console.log(`🔌 Usuário conectado: ${socket.id}`);

  socket.on("join", (userId) => {
    if (userId) {
      console.log(`🔗 Vinculando o userId: ${userId} ao socket: ${socket.id}`);
      connectedUsers[userId] = socket.id;
    } else {
      console.error("❌ userId não fornecido no evento 'join'");
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Usuário desconectado: ${socket.id}`);
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        console.log(
          `❌ Desvinculando userId: ${userId} do socket: ${socket.id}`
        );
        delete connectedUsers[userId];
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`Usuário desconectado: ${socket.id}`);
    // Remova o userId da lista de usuários conectados
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Conectado ao MongoDB");
    // Use o servidor HTTP para escutar na porta
    server.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erro ao conectar ao MongoDB:", err);
  });

module.exports = { server, io, connectedUsers }; // Agora você pode acessar o io e connectedUsers de outros arquivos
