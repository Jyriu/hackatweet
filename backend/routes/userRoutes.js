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

// Routes pour obtenir les abonnés et abonnements
router.get('/:username/followers', userController.getFollowers);
router.get('/:username/following', userController.getFollowing);

// Route pour mettre à jour les mots-clés et hashtags depuis l'IA
router.post('/update-keywords', auth, userController.updateKeywordsFromAI);

// Route pour obtenir les utilisateurs suggérés
router.get('/suggested-users', auth, userController.getSuggestedUsers);

// Route générique pour basculer les paramètres utilisateur (camera, notifications, etc.)
router.put('/toggle/:setting', auth, userController.toggleUserSetting);

module.exports = router;