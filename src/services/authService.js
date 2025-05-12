const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.register = async (email, password) => {
  console.log('Empfange Registrierung-Anfrage mit E-Mail:', email); // Log, um zu sehen, ob die Anfrage kommt

  try {
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('Ergebnisse der Überprüfung auf existierenden Benutzer:', userExists.rows); // Ausgabe der Benutzerüberprüfung

    if (userExists.rows.length > 0) {
      console.error('Benutzer existiert bereits');
      throw new Error('Benutzer existiert bereits');
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
      console.log('Passwort erfolgreich gehasht');
    } catch (hashError) {
      console.error('Fehler beim Hashen des Passworts:', hashError);
      throw new Error('Fehler beim Hashen des Passworts');
    }

    const insertResult = await db.query(
      'INSERT INTO users (email, password_hash, level, xp, created_at) VALUES ($1, $2, 0, 0, NOW())',
      [email, hashedPassword]
    );
    
    console.log('Benutzer erfolgreich in die Datenbank eingefügt:', insertResult); // Log für erfolgreiche Datenbankoperation

    return { message: 'Registrierung erfolgreich' };

  } catch (err) {
    console.error('Fehler bei der Registrierung:', err); // Ausgabe des Fehlers im Backend
    throw new Error(`Fehler bei der Registrierung: ${err.message}`);
  }
};





exports.login = async (email, password) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new Error('Benutzer nicht gefunden');
  }

  const user = result.rows[0];

  const isMatch = await bcrypt.compare(password, user.password_hash); 
  if (!isMatch) {
    throw new Error('Falsches Passwort');
  }

  return { message: 'Login erfolgreich' };
};

exports.forgotPassword = async (email) => {
  // Dummy-Implementierung (später z.B. E-Mail senden)
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new Error('E-Mail nicht gefunden');
  }

  // TODO: E-Mail mit Passwort-Reset-Link senden
  return { message: 'Passwort-Reset-E-Mail wurde gesendet (Demo)' };
};
