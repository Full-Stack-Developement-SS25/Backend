const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const db = new Client({
  connectionString: process.env.SUPABASE_CONNECTION_STRING,
});

db.connect()
  .then(() => console.log('✅ Mit der Datenbank verbunden'))
  .catch(err => console.error('❌ Fehler bei der Datenbankverbindung:', err));

module.exports = db;
