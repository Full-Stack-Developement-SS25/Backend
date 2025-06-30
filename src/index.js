const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const modelRoutes = require("./routes/modelRoutes");
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const taskRoutes = require('./routes/taskRoutes');
const badgeRoutes = require("./routes/badgeRoutes");
const promptHistoryRoutes = require('./routes/promptHistoryRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());


// Routen verwenden
app.use('/api/auth', authRoutes);
app.use('/api/user', protectedRoutes);
app.use('/api/user', userRoutes); 
app.use('/api/user', promptHistoryRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/tasks', taskRoutes);
app.use("/api/models", modelRoutes);

// Test-Route
app.get('/', (req, res) => {
  res.send('API läuft!');
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
