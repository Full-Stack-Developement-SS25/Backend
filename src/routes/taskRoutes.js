const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Alle öffentlichen Aufgaben (ohne Filter — Achtung: meist nur für Admin sinnvoll!)
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, difficulty, description FROM tasks
       WHERE user_id IS NULL`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fehler beim Abrufen der Aufgaben:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Alle offenen Aufgaben für einen Nutzer (global + persönliche)
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await db.query(
      `
      SELECT t.*
      FROM tasks t
      WHERE (t.user_id IS NULL OR t.user_id = $1)
        AND NOT EXISTS (
          SELECT 1
          FROM prompts p
          WHERE p.task_id = t.id
            AND p.user_id = $1
            AND p.done = true
        )
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fehler beim Abrufen der Aufgaben:", err.message);
    res.status(500).json({
      error: "Fehler beim Abrufen der Aufgaben",
      details: err.message,
    });
  }
});

module.exports = router;
