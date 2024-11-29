const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = new User({ name, email, password: hashedPassword, role });
//     await user.save();

//     res.status(201).json(user);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };
exports.registerWorker = async (req, res) => {
  try {
    const { fullName, emailOrPhone, cpf, phone, address, password } = req.body;

    // CPF validation (backend)
    if (!validateCPF(cpf)) {
      return res.status(400).json({ message: "CPF inválido." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ emailOrPhone });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "E-mail ou Telefone já cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      emailOrPhone,
      cpf,
      phone,
      address,
      password: hashedPassword,
      role: "worker",
      status: "pending", // Status inicial como pendente
    });

    await user.save();

    // Send confirmation email (placeholder)
    // emailService.sendConfirmationEmail(user.emailOrPhone);

    res.status(201).json({ message: "Registro pendente de aprovação." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { sub: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({ access_token: token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
