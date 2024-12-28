// middlewares/selfOrAdmin.middleware.js

exports.selfOrAdmin = (req, res, next) => {
  const userIdParam = req.params.id;

  // Se não for admin e não for o próprio user, 403
  if (req.user.role !== "admin" && req.user._id.toString() !== userIdParam) {
    return res.status(403).json({ message: "Acesso negado." });
  }
  next();
};
