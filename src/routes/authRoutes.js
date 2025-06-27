const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.get('/users', authController.getAllUsers);
router.post('/firebase-login', authController.firebaseLogin);
router.post('/github-login', authController.githubLogin);
router.get('/github/callback', authController.githubCallback);



module.exports = router;
