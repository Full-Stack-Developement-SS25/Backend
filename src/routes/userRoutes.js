const express = require("express");
const router = express.Router();
const db = require("../config/db");
const badgeService = require("../services/badgeService");
const axios = require("axios");
const models = require("../config/models");

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

// Anzahl erledigter Aufgaben eines Users
router.get("/:id/completed-count", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query(
      "SELECT COUNT(*) FROM prompts WHERE user_id = $1 AND done = true",
      [userId]
    );

    const count = parseInt(result.rows[0].count, 10);

    res.json({ completedTasks: count });
  } catch (err) {
    console.error("Fehler beim Abrufen der erledigten Aufgaben:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Premium-Status eines Users
router.get("/:id/premium", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query(
      "SELECT is_premium FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ isPremium: result.rows[0].is_premium });
  } catch (err) {
    console.error("Fehler beim Prüfen des Premium-Status:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Premium kaufen (nur zu Testzwecken)
router.post("/:id/premium/buy", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query(
      "UPDATE users SET is_premium = true WHERE id = $1 RETURNING is_premium",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ isPremium: result.rows[0].is_premium });
  } catch (err) {
    console.error("Fehler beim Kauf von Premium:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Neue Aufgabe per KI generieren (nur für Premium-User)
router.post("/:id/task/generate", async (req, res) => {
  const userId = req.params.id;

  try {
    const premRes = await db.query(
      "SELECT is_premium FROM users WHERE id = $1",
      [userId]
    );

    if (premRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!premRes.rows[0].is_premium) {
      return res.status(403).json({ error: "Nur für Premium-Benutzer" });
    }

    const promptText =
      "Erstelle eine Aufgabe für das Thema Prompt Engineering. Gib ein JSON mit Titel, Beschreibung, Schwierigkeit (Leicht, Mittel, Schwer) und Typ (Analyse, Beschreibung, Kreativ, Umformulierung, Dialog, Struktur) zurück.";

    const aiRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: models["gpt4o mini"],
        messages: [{ role: "user", content: promptText }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://promptmaster.de",
          "X-Title": "PromptMaster Aufgabengenerator",
          "Content-Type": "application/json",
        },
      }
    );

    const raw = aiRes.data.choices[0].message.content;
    let task;
    try {
      task = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Generierte Aufgabe kein gültiges JSON:", raw);
      return res
        .status(500)
        .json({ error: "Antwort der KI ist kein gültiges JSON" });
    }

    const insertRes = await db.query(
      `INSERT INTO tasks (title, description, difficulty, type, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [task.title, task.description, task.difficulty, task.type, userId]
    );

    res.json(insertRes.rows[0]);
  } catch (err) {
    console.error(
      "❌ Fehler beim Generieren der Aufgabe:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Aufgabengenerierung fehlgeschlagen" });
  }
});


// Alle Badges eines Users
router.get("/:id/badges", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query(
      `SELECT b.*, ub.awarded_at
   FROM user_badges ub
   JOIN badges b ON ub.badge_id = b.id
   WHERE ub.user_id = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fehler beim Abrufen der Badges:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// XP hinzufügen und Level ggf. erhöhen
router.post("/:id/xp", async (req, res) => {
  const userId = req.params.id;
  const { xp } = req.body;

  if (typeof xp !== "number" || xp <= 0) {
    return res.status(400).json({ error: "XP muss eine positive Zahl sein" });
  }

  const BASE_XP = 100;
  const XP_INCREMENT = 50;

  try {
    const result = await db.query("SELECT xp, level FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User nicht gefunden" });
    }

    let { xp: currentXP, level: currentLevel } = result.rows[0];
    let totalXP = currentXP + xp;
    let newLevel = currentLevel;
    let leveledUp = false;

    while (true) {
      const requiredXP = BASE_XP + (newLevel - 1) * XP_INCREMENT;

      if (totalXP >= requiredXP) {
        totalXP -= requiredXP;
        newLevel += 1;
        leveledUp = true;
      } else {
        break;
      }
    }

    await db.query("UPDATE users SET xp = $1, level = $2 WHERE id = $3", [
      totalXP,
      newLevel,
      userId,
    ]);

    await badgeService.checkAndAwardBadges(userId);

    res.json({
      success: true,
      newXP: totalXP,
      newLevel,
      leveledUp,
    });
  } catch (err) {
    console.error("❌ Fehler beim XP-Update:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

module.exports = router;
