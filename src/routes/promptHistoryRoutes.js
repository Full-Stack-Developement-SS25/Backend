const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// Alle vergangenen Prompts eines Users abrufen
router.get("/:id/prompt-history", authMiddleware, async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query(
      `SELECT
        p.id,
        p.task_id,
        t.title,
        t.description,
        t.difficulty,
        t.type,
        p.created_at,
        p.content,
        pr.score,
        pr.feedback,
        pr.keyword_hits
       FROM prompts p
       JOIN tasks t ON p.task_id = t.id
       LEFT JOIN prompt_results pr ON pr.prompt_id = p.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Prompt-Historie:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Details zu einem einzelnen Prompt abrufen
router.get(
  "/:id/prompt-history/:promptId",
  authMiddleware,
  async (req, res) => {
    const userId = req.params.id;
    const promptId = req.params.promptId;

    try {
      const result = await db.query(
        `SELECT
          p.id,
          p.task_id,
          t.title,
          t.description,
          t.difficulty,
          t.type,
          p.created_at,
          p.content,
          pr.score,
          pr.feedback,
          pr.keyword_hits
         FROM prompts p
         JOIN tasks t ON p.task_id = t.id
         LEFT JOIN prompt_results pr ON pr.prompt_id = p.id
        WHERE p.user_id = $1 AND p.id = $2
        ORDER BY p.created_at DESC`,
        [userId, promptId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Prompt nicht gefunden" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Fehler beim Abrufen des Prompts:", err);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  }
);

// Prompt samt Ergebnis löschen
router.delete(
  "/:id/prompt-history/:promptId",
  authMiddleware,
  async (req, res) => {
    const userId = req.params.id;
    const promptId = req.params.promptId;

    try {
      await db.query("BEGIN");

      await db.query("DELETE FROM prompt_results WHERE prompt_id = $1", [
        promptId,
      ]);
      const result = await db.query(
        "DELETE FROM prompts WHERE id = $1 AND user_id = $2",
        [promptId, userId]
      );

      await db.query("COMMIT");

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Prompt nicht gefunden" });
      }

      res.json({ message: "Prompt gelöscht" });
    } catch (err) {
      await db.query("ROLLBACK");
      console.error("Fehler beim Löschen des Prompts:", err);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  }
);

module.exports = router;
