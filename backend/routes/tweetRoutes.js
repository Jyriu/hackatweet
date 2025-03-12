// Routes pour les tweets

const express = require('express');
const router = express.Router();
const tweetController = require('../controllers/tweetController');
const commentController = require('../controllers/commentController');
const { auth } = require('../middleware/authMiddleware');

// Routes d'authentification
router.post('/createTweet', auth, tweetController.createTweet);
router.get('/tweets', tweetController.getTweets);
router.post('/like/:id', auth, tweetController.likeTweet);
router.post('/retweet/:id', auth, tweetController.retweet);
router.get('/userTweets', auth, tweetController.getUserTweets);
router.post('/comment/:id', auth, commentController.addComment);
router.post('/reply/:id', auth, commentController.replyToComment);
router.put('/editcomment/:id', auth, commentController.updateComment);
router.post('/likeComment/:id', auth, commentController.likeComment);
router.get('/followingTweets', auth, tweetController.getFollowingTweets);
router.get('/likedTweetsByFollowers', auth, tweetController.getLikedTweetsByFollowers);
router.get('/getLikedTweetsByFollowings', auth, tweetController.getLikedTweetsByFollowings);
router.get('/likedTweetsByUser', auth, tweetController.getLikedTweetsByUser);
router.get('/comments/:id', auth, commentController.getComments);
router.delete('/deleteTweet/:id', auth, tweetController.deleteTweet);
router.delete('/deleteAllTweets', auth, tweetController.deleteAllTweets);
router.post('/signet/:id', auth, tweetController.bookmarkTweet);
router.get('/commentedTweetsByFollowings', auth, tweetController.getCommentedTweetsByFollowings);
router.get('/gettweet/:id', tweetController.getTweetById);
router.get('/allTweetsByFollowings', auth, tweetController.getAllTweetsByFollowings);

module.exports = router;