const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// .env laden
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routen importieren
const authRoutes = require('./routes/authRoutes');

app.use(cors());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API läuft!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
