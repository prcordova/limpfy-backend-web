// src/middlewares/roles.middleware.js

/**
 * Middleware para restringir acesso apenas a determinados papéis (roles).
 * Ex: authorizeRoles("admin", "support")
 */
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Se `req.user` não estiver setado, significa que falhou a autenticação
    if (!req.user || !req.user.role) {
      return res
        .status(401)
        .json({ message: "Não autenticado ou sem role definida." });
    }

    // Se a role do usuário não estiver na lista esperada, retorna 403
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    // Se passou, libera:
    next();
  };
};
