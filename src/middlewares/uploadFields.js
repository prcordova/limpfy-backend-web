const multer = require("multer");
const path = require("path");

// Função para filtrar apenas arquivos de imagem
const fileFilter = (req, file, cb) => {
  // Aceita apenas imagens de tipos comuns
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);

  console.log("Extname:", path.extname(file.originalname).toLowerCase());
  console.log("Mimetype:", file.mimetype);

  if (mimeType && extname) {
    return cb(null, true);
  } else {
    console.log("Arquivo de imagem inválido!");
    cb(new Error("Arquivo de imagem inválido!")); // Mensagem de erro customizada
  }
};

// Configuração de armazenamento para o multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Define a pasta para salvar as imagens
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nomeia o arquivo de forma única
  },
});

// Configuração do multer para lidar com múltiplos campos
const uploadFields = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
}).fields([
  { name: "avatar", maxCount: 1 }, // Campo para avatar
  { name: "background", maxCount: 1 }, // Campo para background
]);

module.exports = uploadFields;
