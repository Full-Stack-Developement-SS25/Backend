const authService = require('../services/authService');
const db = require('../config/db'); 
const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Registrierung
exports.register = async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const result = await authService.register(email, password, username);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login mit Email + Passwort
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    console.error('Fehler beim Login:', err);
    res.status(400).json({ error: err.message });
  }
};

// Passwort vergessen
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (err) {
    console.error('Fehler beim Zurücksetzen des Passworts:', err);
    res.status(400).json({ error: err.message });
  }
};

// Passwort zurücksetzen
exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    const result = await authService.resetPassword(email, token, newPassword);
    res.status(200).json(result);
  } catch (err) {
    console.error('Fehler beim Zurücksetzen des Passworts:', err);
    res.status(400).json({ error: err.message });
  }
};


// Alle Benutzer mit XP und Level abrufen (GET /api/users)
exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query("SELECT id, username, xp, level FROM users ORDER BY xp DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Fehler beim Abrufen aller Benutzer:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

// Firebase Login 
exports.firebaseLogin = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Kein Token erhalten' });
  }

  try {
    const result = await authService.firebaseLogin(token);
    res.status(200).json({
      message: 'Login erfolgreich',
      token: result.token,
      user: { id: result.user.id, email: result.user.email },
    });
  } catch (err) {
    console.error('Firebase Token Verifikation Fehler:', err);
    res.status(401).json({ message: 'Ungültiges Firebase Token' });
  }
};

// GitHub Login
exports.githubLogin = async (req, res) => {
  const { code, platform } = req.body;  // platform kann "web" oder "app" sein

  console.log('📣 /github-login aufgerufen');
  console.log('Code:', code);
  console.log('Platform:', platform);

  if (!code) {
    return res.status(400).json({ message: 'Kein Code erhalten' });
  }

  try {
    const result = await authService.githubLogin(code, platform);
    res.status(200).json({
      message: 'GitHub Login erfolgreich',
      token: result.token,
      user: { id: result.user.id, email: result.user.email },
    });
  } catch (err) {
    console.error('GitHub Token Verifikation Fehler:', err);
    res.status(401).json({ message: 'Ungültiges GitHub Token' });
  }
};


// Callback-Endpoint für FlutterWebAuth
exports.githubCallback = async (req, res) => {
  const code = req.query.code;

  console.log('📣 /github/callback aufgerufen');
  console.log('Code aus Query:', code);

  if (!code) {
    console.log('⚠️  Kein Code im Callback erhalten');
    return res.status(400).send('Kein Code erhalten');
  }

  // FlutterWebAuth erwartet, dass diese Seite den finalen URL zurück an das
  // öffnende Fenster sendet. Dadurch kann die Bibliothek den `code` auslesen.
  res.send(
    `<!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <title>GitHub Callback</title>
      </head>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(window.location.href, '*');
            window.close();
          }
        </script>
        <p>GitHub Anmeldung abgeschlossen. Du kannst dieses Fenster schließen.</p>
      </body>
    </html>`
  );
};

// E-Mail-Bestätigung
exports.verifyEmail = async (req, res) => {
  const { email, token } = req.query;
  try {
    const result = await authService.verifyEmail(email, token);
    res.status(200).json(result);
  } catch (err) {
    console.error('Fehler bei der E-Mail-Bestätigung:', err);
    res.status(400).json({ error: err.message });
  }
};

// Erneutes Senden der E-Mail-Bestätigung
exports.resendVerification = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await authService.resendVerification(email);
    res.status(200).json(result);
  } catch (err) {
    console.error('Fehler beim erneuten Senden der Bestätigung:', err);
    res.status(400).json({ error: err.message });
  }
};

