const express = require('express');
const dotenv = require('dotenv');
const { Client } = require('pg'); // Importiere den pg-Client

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL-Verbindungsdetails aus der .env-Datei
const dbConfig = {
  connectionString: process.env.SUPABASE_CONNECTION_STRING, // Verbindungsstring aus der .env-Datei
};

// Neue PostgreSQL-Datenbankverbindung erstellen
const client = new Client(dbConfig);

// Verbinde mit der Datenbank
client.connect()
  .then(() => console.log('Erfolgreich mit der Datenbank verbunden!'))
  .catch(err => console.error('Datenbankverbindung fehlgeschlagen:', err));

// Route für den Zugriff auf die API
app.get('/', async (req, res) => {
  try {
    // Eine einfache Datenbankabfrage ausführen
    const result = await client.query('SELECT NOW()'); // Beispielabfrage: Aktuelle Zeit von PostgreSQL abfragen
    res.send(`API läuft! Aktuelle Zeit aus der Datenbank: ${result.rows[0].now}`);
  } catch (error) {
    res.status(500).send('Fehler bei der Datenbankabfrage: ' + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
