const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Kein Token vorhanden' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // z.B. { id: ..., email: ... }
    next();
  } catch (err) {
    console.error(err);
    return res.status(403).json({ error: 'Ungültiger oder abgelaufener Token' });
  }
};
