const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Einzelner User (für Dashboard)
router.get("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query("SELECT xp, level FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fehler beim Abrufen des Benutzers:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Alle User für Scoreboard
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, xp, level FROM users ORDER BY level DESC, xp DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fehler beim Abrufen aller Benutzer:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

module.exports = router;
