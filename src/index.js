const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Routen importieren
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const userRoutes = require('./routes/userRoutes');
const badgeRoutes = require('./routes/badgeRoutes');

// Routen verwenden
app.use('/api/auth', authRoutes);
app.use('/api/user', protectedRoutes);   // z. B. /api/user/me
app.use('/api/user', userRoutes);        // z. B. /api/user/:id
app.use('/api/badges', badgeRoutes);     // z. B. /api/badges/:userId

// Test-Route
app.get('/', (req, res) => {
  res.send('API läuft!');
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
