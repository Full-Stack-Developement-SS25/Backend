const authService = require('../services/authService');

exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await authService.register(email, password);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/users → alle User mit XP & Level
const getAllUsers = async (req, res) => {
  try {
    const result = await db.query("SELECT id, username, xp, level FROM users ORDER BY xp DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Fehler beim Abrufen aller Benutzer:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

