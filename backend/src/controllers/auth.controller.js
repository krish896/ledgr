const authService = require("../services/auth.service");

async function register(req, res) {
  const result = await authService.register(req.body);
  const { user, token } = result;

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({ user });
}

async function login(req, res) {
  const result = await authService.login(req.body);
  const { user, token } = result;

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({ user });
}

async function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({ message: "Logged out successfully" });
}

async function me(req, res) {
  const user = await authService.me(req.user);
  res.status(200).json({ user });
}

module.exports = { register, login, logout, me };
