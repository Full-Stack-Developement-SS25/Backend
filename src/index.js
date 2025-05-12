const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const userRoutes = require("./routes/userRoutes");

// .env laden
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: '*',  
}));

// Routen importieren
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');

app.use('/api/user', protectedRoutes);
app.use(cors());
app.use('/api/auth', authRoutes);
app.use("/api/user", userRoutes);


app.get('/', (req, res) => {
  res.send('API läuft!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
