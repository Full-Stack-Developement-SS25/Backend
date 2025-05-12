const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },  
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

exports.register = async (email, password, username) => {
  try {
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      throw new Error('Benutzer existiert bereits');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertResult = await db.query(
      'INSERT INTO users (email, password_hash, username, level, xp, created_at) VALUES ($1, $2, $3, 0, 0, NOW())',
      [email, hashedPassword, username]
    );

    return { message: 'Registrierung erfolgreich' };
  } catch (err) {
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

 
  const token = jwt.sign(
    { id: user.id, email: user.email }, // Payload
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return {
    message: 'Login erfolgreich',
    token, // ⬅️ wird an den Client zurückgegeben
    user: { id: user.id, email: user.email },
  };
};

exports.forgotPassword = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new Error('E-Mail nicht gefunden');
  }

  return { message: 'Passwort-Reset-E-Mail wurde gesendet (Demo)' };
};

