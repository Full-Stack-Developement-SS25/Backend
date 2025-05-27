const express = require("express");
const router = express.Router();
const axios = require("axios");
const db = require("../config/db");

router.post("/", async (req, res) => {
  const { task, prompt, userId, taskId } = req.body;

  if (!prompt || !task || !userId || !taskId) {
    return res.status(400).json({
      error: "Benötigte Felder fehlen (task, prompt, userId, taskId)",
    });
  }

  try {
    const aiRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
Du bist ein Modell zur Bewertung der Qualität von Prompts im Kontext einer Aufgabenstellung.

Deine Aufgabe ist es, den folgenden Prompt zu bewerten. Analysiere ihn hinsichtlich:

- **Klarheit**: Ist der Prompt eindeutig und präzise formuliert?
- **Kreativität**: Zeigt der Prompt originelle Denkansätze oder Herangehensweisen?
- **Passung zur Aufgabenstellung**: Erfüllt der Prompt das Ziel bzw. die Anforderung der Aufgabe?

Gib deine Bewertung **ausschließlich** im folgenden JSON-Format zurück:

{
  "stars": 1–5, 
  "explanation": "Begründe deine Bewertung. Zeige konkrete Schwächen und Stärken auf.",
  "feedbackShort": "Optional: Eine kurze Zusammenfassung in einem Satz.",
  "improvementSuggestions": [
    "Konkrete Vorschläge zur Verbesserung des Prompts.",
    "Gib nach Möglichkeit alternative, bessere Formulierungen an."
  ],
  "bestPractices": [
    "Fasse relevante Best Practices zusammen, die bei dieser Art von Aufgabe helfen.",
    "Erkläre, wie der Prompt mit diesen besser erfüllt wäre."
  ]
}

Halte dich **streng** an das JSON-Format. Verwende keine zusätzlichen Kommentare oder Texte außerhalb der JSON-Struktur.
`,
          },
          {
            role: "user",
            content: `Aufgabe: "${task}"\nAntwort: "${prompt}"`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://promptmaster.de",
          "X-Title": "PromptMaster Bewertung",
          "Content-Type": "application/json",
        },
      }
    );

    const raw = aiRes.data.choices[0].message.content;

    let evaluation;
    try {
      evaluation = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Bewertung ist kein gültiges JSON:", raw);
      return res
        .status(500)
        .json({ error: "Antwort der KI ist kein gültiges JSON", raw });
    }

    await db.query(
      `INSERT INTO prompts (user_id, task_id, content, evaluation_json, score, done)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (user_id, task_id) DO UPDATE 
       SET content = EXCLUDED.content,
           evaluation_json = EXCLUDED.evaluation_json,
           score = EXCLUDED.score,
           done = true`,
      [
        userId,
        taskId,
        prompt, // statt prompt_text
        evaluation,
        evaluation.stars || null,
      ]
    );
    

    res.json(evaluation);
  } catch (err) {
    console.error(
      "❌ Fehler bei Bewertung oder Speicherung:",
      err.response?.data || err.message
    );
    res
      .status(500)
      .json({ error: "Bewertung oder Speicherung fehlgeschlagen" });
  }
});

module.exports = router;
