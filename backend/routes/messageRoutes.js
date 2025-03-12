const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { auth } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Obtenir le nombre total de messages non lus
router.get('/unread', messageController.getUnreadCount);

// Envoyer un nouveau message
router.post('/', messageController.sendMessage);

// Marquer un message spécifique comme lu
router.put('/:messageId/read', messageController.markMessageAsRead);

// Supprimer un message (uniquement l'expéditeur peut le faire)
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router; 