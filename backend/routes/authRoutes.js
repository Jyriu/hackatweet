const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');

// Routes d'authentification
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/current', auth, authController.getCurrentUser);

module.exports = router;