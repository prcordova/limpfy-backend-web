const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

exports.register = async (req, res) => {
  try {
    const { fullName, emailOrPhone, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      emailOrPhone,
      password: hashedPassword,
      role: "client", // Por padrão, define como cliente
    });

    await user.save();

    res.status(201).json({ message: "Usuário registrado com sucesso." });
  } catch (err) {
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
