const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');

// Toutes les routes de conversations nécessitent une authentification
router.use(authMiddleware.auth);

// Obtenir toutes les conversations de l'utilisateur connecté
router.get('/', conversationController.getConversations);

// Créer une nouvelle conversation ou récupérer une existante
router.post('/', conversationController.createConversation);

// Obtenir les messages d'une conversation spécifique
router.get('/:conversationId/messages', conversationController.getMessages);

// Envoyer un message dans une conversation
router.post('/message', conversationController.sendMessage);

// Marquer tous les messages d'une conversation comme lus
router.put('/:conversationId/read', conversationController.markConversationAsRead);

// Supprimer une conversation
router.delete('/:conversationId', conversationController.deleteConversation);

module.exports = router; 