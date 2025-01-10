// src/socket.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model"); // Ajuste o caminho se necessário

let io;
const connectedUsers = {};

/** Função para configurar nosso socket.io */
function configureSocket(server) {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // -----------
    // 1) MIDDLEWARE DE AUTENTICAÇÃO DO SOCKET
    // -----------
    io.use(async (socket, next) => {
      try {
        // Geralmente o token vem em `socket.handshake.auth.token`
        // se você usar `io("URL", { auth: { token: ... } })` no frontend
        const token = socket.handshake.auth?.token;

        if (!token) {
          return next(
            new Error("Nenhum token fornecido no handshake do Socket.")
          );
        }

        // Verifica o token
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // Busque o usuário
        const user = await User.findById(payload.sub);
        if (!user) {
          return next(new Error("Usuário não encontrado com esse token."));
        }

        // Anexa o user no socket
        socket.user = user;

        next();
      } catch (err) {
        console.error("Erro no middleware socket.io:", err.message);
        return next(err);
      }
    });

    // -----------
    // 2) EVENTOS DE CONEXÃO
    // -----------
    io.on("connection", (socket) => {
      console.log(`🔌 Usuário conectado: ${socket.id}`);

      // Como já temos `socket.user` definido pelo middleware,
      // podemos pegar o ID real do usuário:
      const userId = socket.user._id.toString();
      connectedUsers[userId] = socket.id;
      console.log(`✅ Vinculando userId ${userId} ao socket ${socket.id}`);

      socket.on("disconnect", () => {
        console.log(`❌ Usuário desconectado: ${socket.id}`);

        // Remover o mapeamento do connectedUsers
        // se pertencia a esse socket
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
