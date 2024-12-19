const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    let averageRating = null;
    if (user.role === "worker" && user.ratings && user.ratings.length > 0) {
      const sum = user.ratings.reduce((acc, r) => acc + r.rating, 0);
      averageRating = sum / user.ratings.length;
    }

    // Pegar o último avatar, se existir
    let finalAvatar = null;
    if (user.avatars && user.avatars.length > 0) {
      const last = user.avatars[user.avatars.length - 1].path;
      finalAvatar = `/uploads/${last}`;
    }

    res.json({
      fullName: user.fullName,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      birthDate: user.birthDate,
      address: user.address,
      workerDetails: user.workerDetails,
      hasAcceptedTerms: user.hasAcceptedTerms,
      termsAcceptedDate: user.termsAcceptedDate,
      faceVerified: user.faceVerified,
      role: user.role,
      status: user.status,
      avatar: finalAvatar,
      averageRating: averageRating,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = {};

    if (req.body.address) {
      updates.address = JSON.parse(req.body.address);
    }

    if (req.file) {
      const avatarDir = path.join(
        process.cwd(),
        "public/uploads/users",
        userId,
        "avatar"
      );
      if (!fs.existsSync(avatarDir)) {
        fs.mkdirSync(avatarDir, { recursive: true });
      }

      const avatarPath = path.join(avatarDir, req.file.filename);
      fs.renameSync(req.file.path, avatarPath);

      updates.$push = {
        avatars: {
          path: `users/${userId}/avatar/${req.file.filename}`,
          uploadedAt: new Date(),
        },
      };
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const token = jwt.sign(
      { sub: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("session-token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    const latestAvatar =
      user.avatars && user.avatars.length > 0
        ? user.avatars[user.avatars.length - 1].path
        : null;

    res.json({
      access_token: token,
      role: user.role,
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      birthDate: user.birthDate,
      address: user.address,
      hasAcceptedTerms: user.hasAcceptedTerms,
      termsAcceptedDate: user.termsAcceptedDate,
      workerDetails: user.workerDetails,
      avatar: latestAvatar ? `/uploads/${latestAvatar}` : null,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Error updating profile." });
  }
};

exports.acceptTerms = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Updating terms for user: ${userId}`);
    const user = await User.findByIdAndUpdate(
      userId,
      {
        hasAcceptedTerms: true,
        termsAcceptedDate: new Date(),
      },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json({
      message: "Terms accepted successfully.",
      hasAcceptedTerms: user.hasAcceptedTerms,
      termsAcceptedDate: user.termsAcceptedDate,
    });
  } catch (err) {
    console.error("Error accepting terms:", err);
    res.status(500).json({ message: "Error accepting terms." });
  }
};

exports.verifyFace = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndUpdate(userId, { faceVerified: true });
    res.json({ message: "Face verified successfully." });
  } catch (err) {
    res.status(500).json({ message: "Error verifying face." });
  }
};
