// src/middlewares/selfOrAdmin.middleware.js

/**
 * Middleware para permitir que apenas o usuário “dono” do recurso ou um
 * “admin” possam prosseguir.
 * Exemplo: rotas de atualização de perfil => /users/:id
 */
exports.selfOrAdmin = (req, res, next) => {
  const userIdParam = req.params.id; // id contido na rota ex.: "/users/:id"

  // Se não for admin e não for o próprio user, retornar 403
  // (req.user._id deve ser transformado em string para comparar)
  if (req.user.role !== "admin" && req.user._id.toString() !== userIdParam) {
    return res.status(403).json({ message: "Acesso negado." });
  }

  next();
};
