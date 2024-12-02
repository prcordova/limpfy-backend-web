const fs = require("fs");
const Tesseract = require("tesseract.js");

exports.validateDocument = async (req, res) => {
  try {
    console.log("Recebendo requisição de validação de documento...");
    const formData = JSON.parse(req.body.formData);
    console.log("Dados do formulário recebidos:", formData);
    const documentPath = req.file.path;

    console.log("Iniciando OCR no documento...");
    // Use Tesseract.js to perform OCR on the document
    const {
      data: { text },
    } = await Tesseract.recognize(documentPath, "por");

    console.log("OCR concluído. Texto extraído:", text);

    // Remover a máscara do CPF no texto extraído
    const textWithoutMask = text.replace(/[\.\-]/g, "");

    // Verifique se o texto contém os valores fornecidos
    const containsFullName = text.includes(formData.fullName.toUpperCase());
    const containsCpf = textWithoutMask.includes(formData.cpf);

    console.log("Nome encontrado:", containsFullName);
    console.log("CPF encontrado:", containsCpf);

    if (!containsFullName || !containsCpf) {
      console.log("Dados do documento não coincidem com os dados fornecidos.");
      return res
        .status(400)
        .json({
          message: "Dados do documento não coincidem com os dados fornecidos.",
        });
    }

    // Clean up the uploaded file
    fs.unlinkSync(documentPath);

    res.json({ message: "Documento validado com sucesso." });
  } catch (err) {
    console.error("Erro ao validar documento:", err);
    res.status(500).json({ message: "Erro ao validar documento." });
  }
};

function extractDataFromText(text) {
  console.log("TEXT SEM TRATAMENTO : ", text);
  // Implement logic to extract fullName and cpf from the OCR text
  // This is a placeholder implementation
  const fullNameMatch = text.match(/NOME E SOBRENOME\s*([A-Z\s]+)/i);
  const cpfMatch = text.match(/CPF\s*[:\s]*([\d\.\-]+)/i);
  const fullName = fullNameMatch ? fullNameMatch[1].trim() : "";
  const cpf = cpfMatch ? cpfMatch[1].replace(/\D/g, "") : "";
  console.log("Nome extraído:", fullName);
  console.log("CPF extraído:", cpf);
  return { fullName, cpf };
}
