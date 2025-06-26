const db = require("../config/db");

exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `
      SELECT id, email, username, level, xp, created_at
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      console.warn(`⚠️ Benutzer mit ID ${userId} nicht gefunden.`);
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    const user = result.rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        level: user.level,
        xp: user.xp,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("❌ Fehler beim Abrufen des Benutzerprofils:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};
