const authService = require('../services/authService');
const db = require('../config/db'); // Deine DB-Verbindung
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const serviceAccount = require('../config/serviceAccountKey.json');


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Eigene JWT Token Generierung (kann auch ins authService ausgelagert werden)
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

// Registrierung
exports.register = async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const result = await authService.register(email, password, username);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login mit Email + Passwort
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    console.error('Fehler beim Login:', err);
    res.status(400).json({ error: err.message });
  }
};

// Passwort zurücksetzen
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (err) {
    console.error('Fehler beim Zurücksetzen des Passworts:', err);
    res.status(400).json({ error: err.message });
  }
};

// Alle Benutzer mit XP und Level abrufen (GET /api/users)
exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query("SELECT id, username, xp, level FROM users ORDER BY xp DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Fehler beim Abrufen aller Benutzer:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.firebaseLogin = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Kein Token erhalten' });
  }

  try {
    const result = await authService.firebaseLogin(token);
    res.status(200).json({
      message: 'Login erfolgreich',
      token: result.token,
      user: { id: result.user.id, email: result.user.email },
    });
  } catch (err) {
    console.error('Firebase Token Verifikation Fehler:', err);
    res.status(401).json({ message: 'Ungültiges Firebase Token' });
  }
};