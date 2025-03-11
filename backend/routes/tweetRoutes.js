// Routes pour les tweets

const express = require('express');
const router = express.Router();
const tweetController = require('../controllers/tweetController');
const { auth } = require('../middleware/authMiddleware');

// Routes d'authentification
router.post('/createTweet', auth, tweetController.createTweet);
router.get('/tweets', auth, tweetController.getTweets);
router.post('/like/:id', auth, tweetController.likeTweet);
router.post('/retweet/:id', auth, tweetController.retweet);
router.get('/userTweets', auth, tweetController.getUserTweets);
router.post('/comment/:id', auth, tweetController.addComment);
router.put('/editcomment/:id', auth, tweetController.updateComment);
router.post('/likeComment/:id', auth, tweetController.likeComment);
router.get('/followingTweets', auth, tweetController.getFollowingTweets);
router.get('/likedTweetsByFollowers', auth, tweetController.getLikedTweetsByFollowers);
router.get('/getLikedTweetsByFollowings', auth, tweetController.getLikedTweetsByFollowings);
router.get('/likedTweetsByUser', auth, tweetController.getLikedTweetsByUser);
router.get('/comments/:id', auth, tweetController.getComments);
router.delete('/deleteTweet/:id', auth, tweetController.deleteTweet);
router.delete('/deleteAllTweets', auth, tweetController.deleteAllTweets);

module.exports = router;