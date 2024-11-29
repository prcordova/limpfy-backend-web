const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

exports.register = async (req, res) => {
  try {
    const { fullName, email, cpf, phone, birthDate, password, address } =
      req.body;

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criação do usuário com todos os campos
    const user = new User({
      fullName,
      email,
      cpf,
      phone,
      birthDate,
      password: hashedPassword,
      address, // Aqui, o objeto address é atribuído diretamente
      role: "client", // Por padrão, define como cliente
    });

    await user.save();

    res.status(201).json({ message: "Usuário registrado com sucesso." });
  } catch (err) {
    // Verifica erros de validação do Mongoose
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    const user = await User.findOne({ emailOrPhone });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { sub: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ access_token: token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
