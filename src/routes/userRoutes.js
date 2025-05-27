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

router.post("/:userId/task/:taskId/done", async (req, res) => {
  const { userId, taskId } = req.params;

  try {
    // Optional: existiert schon ein Prompt?
    const promptRes = await db.query(
      "SELECT id FROM prompts WHERE user_id = $1 AND task_id = $2 LIMIT 1",
      [userId, taskId]
    );

    if (promptRes.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Kein Prompt gefunden für diese Aufgabe" });
    }

    // Prompt als "done" markieren
    await db.query(
      "UPDATE prompts SET done = true WHERE user_id = $1 AND task_id = $2",
      [userId, taskId]
    );

    res.json({ message: "Aufgabe als erledigt markiert" });
  } catch (err) {
    console.error("❌ Fehler beim Markieren als erledigt:", err);
    res.status(500).json({ error: "Interner Fehler beim Erledigen" });
  }
});

router.post("/:id/xp", async (req, res) => {
  const userId = req.params.id;
  const { xp } = req.body;

  if (!xp || typeof xp !== "number") {
    return res.status(400).json({ error: "XP muss als Zahl übergeben werden" });
  }

  const XP_PER_LEVEL = 100;

  try {
    // Aktuelle XP und Level des Users abrufen
    const result = await db.query("SELECT xp, level FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User nicht gefunden" });
    }

    let { xp: currentXP, level: currentLevel } = result.rows[0];
    let newXP = currentXP + xp;
    let newLevel = currentLevel;
    let leveledUp = false;

    // Level-Up-Logik
    while (newXP >= XP_PER_LEVEL) {
      newXP -= XP_PER_LEVEL;
      newLevel += 1;
      leveledUp = true;
    }

    // Datenbank aktualisieren
    await db.query("UPDATE users SET xp = $1, level = $2 WHERE id = $3", [
      newXP,
      newLevel,
      userId,
    ]);

    res.json({
      success: true,
      newXP,
      newLevel,
      leveledUp,
    });
  } catch (err) {
    console.error("❌ Fehler beim XP-Update:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

module.exports = router;
