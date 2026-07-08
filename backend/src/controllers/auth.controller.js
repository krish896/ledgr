const authService = require("../services/auth.service");

async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(200).json(result);
}

module.exports = { register };
