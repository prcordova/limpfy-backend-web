// src/middlewares/auth.middleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Middleware para autenticar o token JWT.
 * Verifica se o token é válido e popula o `req.user` com os dados do payload.
 */
exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Verifica se o cabeçalho Authorization segue o padrão "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Token não fornecido ou mal formatado." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Importante: no momento de gerar o token (login), confira se está usando
    // algo como:
    //   jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })
    // para que o payload contenha `.sub` = ID do usuário.

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Payload decodificado do token JWT:", payload);

    // Por padrão, você pode usar `payload.sub` ou `payload.id` dependendo de como
    // está gerando o token. Aqui assumimos que, ao gerar, usou `{ sub: user._id }`.

    const user = await User.findById(payload.sub);
    if (!user) {
      console.log("Usuário não encontrado no DB. ID:", payload.sub);
      return res.status(401).json({ message: "Usuário não encontrado." });
    }

    // “Injeta” o usuário em req.user
    req.user = user;
    next();
  } catch (err) {
    console.error("Erro ao verificar token:", err.message);
    // Pode customizar a mensagem de erro:
    return res.status(401).json({ message: "Token inválido." });
  }
};
