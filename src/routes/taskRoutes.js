const express = require('express');
const router = express.Router();
const db = require('../config/db'); // pg oder supabase-Anbindung

// Alle Aufgaben abrufen
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, title, difficulty, description FROM tasks');
    res.json(result.rows);
  } catch (err) {
    console.error('Fehler beim Abrufen der Aufgaben:', err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await db.query(
      `
      SELECT t.*
      FROM tasks t
      WHERE NOT EXISTS (
        SELECT 1
        FROM prompts p
        WHERE p.task_id = t.id
          AND p.user_id = $1
          AND p.done = true
      )
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fehler beim Abrufen der Aufgaben:", err.message);
    res
      .status(500)
      .json({
        error: "Fehler beim Abrufen der Aufgaben",
        details: err.message,
      });
  }
});



module.exports = router;
