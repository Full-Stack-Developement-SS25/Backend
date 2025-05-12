const db = require('../config/db');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, email, level, xp, created_at, username FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const user = result.rows[0];
    res.status(200).json({ user });
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzerprofils:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};
