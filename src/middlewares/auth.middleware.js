const jwt = require("jsonwebtoken");

/**
 * Middleware para autenticar o token JWT.
 * Verifica se o token é válido e popula o `req.user` com os dados do payload.
 */
exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Token não fornecido ou mal formatado." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // Adiciona os dados do token ao `req.user`
    next();
  } catch (err) {
    console.error("Erro ao verificar token:", err.message);
    res.status(401).json({ message: "Token inválido" });
  }
};

/**
 * Middleware para autorizar apenas empresas.
 * Verifica se o usuário autenticado tem um `companyId` e o `role` apropriado.
 */
exports.authorizeCompany = async (req, res, next) => {
  try {
    const { companyId, role } = req.user; // Obtém os dados do token

    if (!companyId || role !== "company") {
      return res.status(403).json({
        message: "Acesso negado. Apenas empresas podem acessar este recurso.",
      });
    }

    req.companyId = companyId; // Disponibiliza o `companyId` para uso posterior
    next();
  } catch (err) {
    console.error("Erro ao autorizar empresa:", err.message);
    res.status(500).json({ message: "Erro ao verificar autorização." });
  }
};
