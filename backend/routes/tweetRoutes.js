// Routes pour les tweets

const express = require('express');
const router = express.Router();
const tweetController = require('../controllers/tweetController');
const { auth } = require('../middleware/authMiddleware');

// Routes d'authentification
router.post('/createTweet', auth, tweetController.createTweet);
router.get('/test', auth, tweetController.getTweets);

module.exports = router;