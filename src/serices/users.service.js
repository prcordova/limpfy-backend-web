const User = require("../models/user.model");

exports.createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

exports.findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

exports.findUserById = async (id) => {
  return await User.findById(id);
};
