// Routes pour les tweets

const express = require('express');
const router = express.Router();
const tweetController = require('../controllers/tweetController');
const { auth } = require('../middleware/authMiddleware');

// Routes d'authentification
router.post('/createTweet', auth, tweetController.createTweet);
router.get('/tweets',  tweetController.getTweets);
router.post('/like/:id', auth, tweetController.likeTweet);
router.post('/retweet/:id', auth, tweetController.retweet);
router.get('/userTweets', auth, tweetController.getUserTweets);
router.post('/comment/:id', auth, tweetController.addComment); // Add this line

module.exports = router;