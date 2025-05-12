const authService = require('../services/authService');

exports.register = async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const result = await authService.register(email, password, username);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

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
