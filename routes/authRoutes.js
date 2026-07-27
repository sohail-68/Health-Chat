const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.get('/check-verification/:email', authController.checkVerificationStatus);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;