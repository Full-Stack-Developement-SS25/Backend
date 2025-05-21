const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const taskRoutes = require('./routes/taskRoutes');

// .env laden
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

// Routen
app.use('/api/user', protectedRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/tasks', taskRoutes);

// Test-Endpoint
app.get('/', (req, res) => {
  res.send('API läuft!');
});

// Serverstart
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
