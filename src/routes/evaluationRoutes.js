const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/', async (req, res) => {
  const { prompt, task } = req.body;

  if (!prompt || !task) {
    return res.status(400).json({ error: 'Prompt oder Aufgabenstellung fehlt' });
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              `Du bist ein KI-Coach für Prompt-Training. Beurteile die Qualität eines Prompts im Hinblick auf folgende Aufgabenstellung: "${task}". Gib eine Bewertung in Schulnoten (1–6) und eine kurze Begründung.`
          },
          {
            role: 'user',
            content: `Bewerte diesen Prompt: "${prompt}"`
          }
        ],
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://promptmaster.de',
          'X-Title': 'PromptMaster Bewertung',
          'Content-Type': 'application/json',
        },
      }
    );

    const feedback = response.data.choices[0].message.content;

    res.json({ feedback });
  } catch (err) {
    console.error('❌ Bewertung fehlgeschlagen:', err.response?.data || err.message);
    res.status(500).json({ error: 'Bewertung nicht möglich' });
  }
});

module.exports = router;