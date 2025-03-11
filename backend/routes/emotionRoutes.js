// routes/tweetRoutes.js
const express = require('express');
const emotionController = require('../controllers/emotionController');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

// Save emotion for a tweet
router.post('/emotions', emotionController.saveEmotion);

module.exports = router;