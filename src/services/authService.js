const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const admin = require('firebase-admin');
const axios = require('axios');


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

exports.firebaseLogin = async (idToken) => {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const email = decodedToken.email;

  let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  let user;

  if (userResult.rows.length === 0) {
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const insertResult = await db.query(
      'INSERT INTO users (email, username, password_hash, level, xp, created_at) VALUES ($1, $2, $3, 0, 0, NOW()) RETURNING *',
      [email, decodedToken.name || email, hashedPassword]
    );

    user = insertResult.rows[0];
  } else {
    user = userResult.rows[0];
  }

  const token = generateToken(user);
  return { user, token };
};

exports.githubLogin = async (code, platform = 'web') => {
  console.log('⭐ GitHub Login gestartet');
  console.log('Empfangener Code:', code);
  console.log('Plattform:', platform);

  let clientId, clientSecret;

  if (platform === 'app') {
    clientId = process.env.GITHUB_CLIENT_ID_APP;
    clientSecret = process.env.GITHUB_CLIENT_SECRET_APP;
  } else {
    clientId = process.env.GITHUB_CLIENT_ID_WEB;
    clientSecret = process.env.GITHUB_CLIENT_SECRET_WEB;
  }

  console.log('ClientId:', clientId);
  console.log('ClientSecret vorhanden:', clientSecret ? 'ja' : 'nein');

  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      },
      { headers: { Accept: 'application/json' } }
    );

    console.log('GitHub OAuth Token Response:', tokenResponse.data);

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error('Kein Access Token von GitHub erhalten');
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` },
    });

    console.log('GitHub User Response:', userResponse.data);

    let githubUser = userResponse.data;

    if (!githubUser.email) {
      console.log('Keine E-Mail im Userobjekt, hole E-Mails...');
      const emailsResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `token ${accessToken}` },
      });
      console.log('GitHub User Emails:', emailsResponse.data);

      const primaryEmailObj = emailsResponse.data.find(emailObj => emailObj.primary && emailObj.verified);
      if (primaryEmailObj) {
        githubUser.email = primaryEmailObj.email;
        console.log('Primäre, verifizierte E-Mail gefunden:', githubUser.email);
      } else {
        throw new Error('Keine verifizierte E-Mail von GitHub gefunden');
      }
    }

    let userResult = await db.query('SELECT * FROM users WHERE email = $1', [githubUser.email]);
    let user;

    if (userResult.rows.length === 0) {
      console.log('Benutzer nicht gefunden, erstelle neuen Benutzer...');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const insertResult = await db.query(
        'INSERT INTO users (email, username, password_hash, level, xp, created_at) VALUES ($1, $2, $3, 0, 0, NOW()) RETURNING *',
        [githubUser.email, githubUser.login || githubUser.name || githubUser.email, hashedPassword]
      );
      user = insertResult.rows[0];
      console.log('Neuer Benutzer angelegt:', user);
    } else {
      user = userResult.rows[0];
      console.log('Benutzer gefunden:', user);
    }

    const token = generateToken(user);
    console.log('JWT Token erzeugt:', token);

    return { user, token };
  } catch (error) {
    console.error('🚨 Fehler beim GitHub Login:', error.response?.data || error.message || error);
    throw error;
  }
};

