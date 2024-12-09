// src/socket.js
const { Server } = require("socket.io");

let io;
const connectedUsers = {};

function configureSocket(server) {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log(`🔌 Usuário conectado: ${socket.id}`);

      socket.on("join", (userId) => {
        if (userId) {
          connectedUsers[userId] = socket.id;
          console.log(
            `✅ Vinculando o userId: ${userId} ao socket: ${socket.id}`
          );
        } else {
          console.error("❌ userId não fornecido no evento 'join'");
        }
      });

      socket.on("disconnect", () => {
        console.log(`❌ Usuário desconectado: ${socket.id}`);
        for (const uid in connectedUsers) {
          if (connectedUsers[uid] === socket.id) {
            console.log(
              `❌ Desvinculando userId: ${uid} do socket: ${socket.id}`
            );
            delete connectedUsers[uid];
          }
        }
      });
    });
  }
  return io;
}

function getIO() {
  if (!io) {
    throw new Error(
      "Socket.io não foi inicializado. Chame configureSocket primeiro."
    );
  }
  return io;
}

function getConnectedUsers() {
  return connectedUsers;
}

module.exports = { configureSocket, getIO, getConnectedUsers };
