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

module.exports = router;
