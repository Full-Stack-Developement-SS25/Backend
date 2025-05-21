const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/users', authController.getAllUsers);
router.post('/firebase-login', authController.firebaseLogin);

module.exports = router;
