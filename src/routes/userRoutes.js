const express = require("express");
const router = express.Router();
const db = require("../config/db");
const badgeService = require("../services/badgeService");
const axios = require("axios");
const models = require("../config/models");

const types = [
  "Analyse",
  "Beschreibung",
  "Kreativ",
  "Umformulierung",
  "Dialog",
  "Struktur",
];


const themes = [
  "Alltag",
  "Wissenschaft",
  "Technik",
  "Kreatives Schreiben",
  "Rollenspiele",
  "Marketing",
  "Kundenservice",
  "Bildung",
  "Beratung",
  "Storytelling",
  "Unterhaltung",
  "Medizin",
  "Umwelt",
  "Journalismus",
  "Gaming",
];

const randomFromArray = (array) =>
  array[Math.floor(Math.random() * array.length)];

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

router.post("/:id/task/generate", async (req, res) => {
  const userId = req.params.id;

  try {
    // 🔍 Premium-Check
    const premRes = await db.query(
      "SELECT is_premium FROM users WHERE id = $1",
      [userId]
    );

    if (premRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!premRes.rows[0].is_premium) {
      return res.status(403).json({ error: "Nur für Premium-Nutzer" });
    }

    // 🔥 Zufälliges Thema und Typ
    const randomTheme = randomFromArray(themes);
    const randomType = randomFromArray(types);

    // 🔥 Prompt an die KI
    const systemPrompt = `
Du bist ein professioneller Aufgaben-Generator für eine Lern-App zum Thema Prompt Engineering.

Dein Ziel ist es, abwechslungsreiche, kreative und sinnvolle Aufgaben zu erstellen, mit denen Nutzer:innen lernen, bessere Prompts für KI zu schreiben.

Wähle für diese Aufgabe das Thema: "${randomTheme}" und den Typ: "${randomType}".

Jede Aufgabe trainiert eine spezifische Fähigkeit. Themen und Typen der Aufgaben sollen möglichst variieren.

🚦 Schwierigkeit bewerten:

Die Schwierigkeit basiert auf der kognitiven Komplexität der Aufgabe und der Anzahl der zu beachtenden Parameter.

🔸 Leicht:
- Aufgabe ist kurz, direkt und ohne komplexe Struktur.
- Eine einzelne Handlung oder Idee.
- Beispiele: Eine kreative Beschreibung, eine einfache Anfrage, ein einzelner Satz oder ein Objekt beschreiben.

🔸 Mittel:
- Aufgabe benötigt mehrere Schritte, Bedingungen oder Strukturen.
- Nutzer:innen müssen überlegen, wie man etwas organisiert, strukturiert oder verschiedene Aspekte kombiniert.
- Beispiele: Schritt-für-Schritt-Anleitung, Vergleich, strukturierte Analyse, mehrere Anforderungen in einem Prompt.

🔸 Schwer:
- Komplexe Aufgaben mit hoher mentaler Belastung.
- Rollenspiele, Dialoge, Debatten, komplexe Simulationen oder Optimierung bestehender Prompts.
- Aufgaben, bei denen mehrere Perspektiven, Rollen oder Zielgruppen gleichzeitig beachtet werden müssen.

Wähle die Schwierigkeit **nicht zufällig**, sondern basierend auf:
- Anzahl der Anforderungen
- Abstraktionsgrad der Aufgabe
- Mentale Komplexität für die Formulierung eines effektiven Prompts

⚠️ Wenn es eine einfache, kurze Aufgabe ist → Leicht.  
Wenn es strukturiert oder bedingt ist → Mittel.  
Wenn es komplexe Rollenspiele, Dialoge oder kritische Optimierungen sind → Schwer.

Vermeide Wiederholungen, sei kreativ, nutze ungewöhnliche Themen oder lustige Situationen.

Gib keine Aufgaben zu historischen Debatten, wenn sie bereits verwendet wurden.

Typen, die du benutzen kannst: Analyse, Beschreibung, Kreativ, Umformulierung, Dialog, Struktur.
`.trim();

    const userPrompt = `
Gib ausschließlich ein JSON-Objekt zurück. Keine Einleitung, keine Erklärung.

Format:

{
  "title": "Titel der Aufgabe",
  "description": "Beschreibung der Aufgabe",
  "difficulty": "Leicht, Mittel oder Schwer",
  "type": "Analyse, Beschreibung, Kreativ, Umformulierung, Dialog oder Struktur"
}

❗ Die Aufgabe ist direkt die Handlungsanweisung.

❌ Kein Text vor oder nach dem JSON.
`.trim();

    // 🔗 API-Call an OpenRouter
    const aiRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: models["gpt-4o"] ?? "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
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
    console.log("🔵 KI-Antwort:", raw);

    // 🛡️ JSON-Parsing absichern
    const jsonMatch = raw.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      console.error("❌ Kein JSON gefunden in:", raw);
      return res
        .status(500)
        .json({ error: "Antwort der KI ist kein gültiges JSON" });
    }

    let task;
    try {
      task = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error(err);
      console.error("❌ Fehler beim JSON-Parsing:", jsonMatch[0]);
      return res.status(500).json({ error: "JSON-Parsing fehlgeschlagen" });
    }

    // 🔍 Validierung
    if (!task.title || !task.description || !task.difficulty || !task.type) {
      return res
        .status(400)
        .json({ error: "Ungültiges JSON-Format von der KI" });
    }

    // ✅ In DB speichern
    const insertRes = await db.query(
      `
      INSERT INTO tasks (title, description, difficulty, type, user_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *`,
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

module.exports = router;




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
