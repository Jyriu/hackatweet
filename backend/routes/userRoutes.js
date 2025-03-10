const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/authMiddleware');

// Routes pour le profil utilisateur
router.get('/profile/:username', userController.getUserByUsername);
router.put('/profile', auth, userController.updateProfile);

// Routes pour follow/unfollow
router.post('/follow/:userToFollowId', auth, userController.followUser);
router.post('/unfollow/:userToUnfollowId', auth, userController.unfollowUser);

<<<<<<< HEAD
=======
// Routes pour obtenir les abonnés et abonnements
router.get('/:username/followers', userController.getFollowers);
router.get('/:username/following', userController.getFollowing);

>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
// Route pour les tweets likés
router.get('/:username/likes', userController.getLikedTweets);

module.exports = router;