const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Middleware para autenticar o token JWT.
 * Verifica se o token é válido e popula o `req.user` com os dados do payload.
 */
exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Token não fornecido ou mal formatado." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Payload:", payload); // Adiciona log para verificar o payload

    const user = await User.findById(payload.sub); // Corrige para usar payload.sub
    if (!user) {
      console.log("Usuário não encontrado com ID:", payload.sub); // Adiciona log para verificar o ID do usuário
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    req.user = user; // Adiciona os dados do usuário ao `req.user`
    next();
  } catch (err) {
    console.error("Erro ao verificar token:", err.message);
    res.status(401).json({ message: "Token inválido" });
  }
};
