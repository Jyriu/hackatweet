const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { auth } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Obtenir la liste des conversations
router.get('/conversations', messageController.getConversations);

// Obtenir le nombre total de messages non lus
router.get('/unread', messageController.getUnreadCount);

// Obtenir l'historique des messages avec un utilisateur spécifique
router.get('/:userId', messageController.getMessageHistory);

// Marquer tous les messages d'un utilisateur comme lus
router.put('/:userId/read', messageController.markConversationAsRead);

module.exports = router; 