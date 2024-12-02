const fs = require("fs");
const Tesseract = require("tesseract.js");

exports.validateDocument = async (req, res) => {
  try {
    console.log("Recebendo requisição de validação de documento...");
    const { formData } = JSON.parse(req.body.formData);
    const documentPath = req.file.path;

    console.log("Iniciando OCR no documento...");
    // Use Tesseract.js to perform OCR on the document
    const {
      data: { text },
    } = await Tesseract.recognize(documentPath, "eng");

    console.log("OCR concluído. Texto extraído:", text);

    // Extract relevant information from the OCR text
    const extractedData = extractDataFromText(text);

    console.log("Dados extraídos do documento:", extractedData);

    // Verifique se os dados extraídos estão vazios
    if (!extractedData.fullName || !extractedData.cpf) {
      console.log("Documento inválido");
      return res.status(400).json({
        message: "Documento inválido",
      });
    }

    // Compare extracted data with form data
    if (
      extractedData.fullName !== formData.fullName ||
      extractedData.cpf !== formData.cpf
    ) {
      console.log("Dados do documento não coincidem com os dados fornecidos.");
      return res.status(400).json({
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
  // Implement logic to extract fullName and cpf from the OCR text
  // This is a placeholder implementation
  const fullNameMatch = text.match(/Nome:\s*(.*)/);
  const cpfMatch = text.match(/CPF:\s*(\d{3}\.\d{3}\.\d{3}-\d{2})/);
  const fullName = fullNameMatch ? fullNameMatch[1] : "";
  const cpf = cpfMatch ? cpfMatch[1] : "";
  return { fullName, cpf };
}
