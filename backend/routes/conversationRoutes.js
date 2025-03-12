const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { auth } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Obtenir toutes les conversations de l'utilisateur
router.get('/', conversationController.getConversations);

// Créer une nouvelle conversation
router.post('/', conversationController.createConversation);

// Obtenir les détails d'une conversation spécifique
router.get('/:conversationId', conversationController.getConversation);

// Obtenir les messages d'une conversation avec pagination
router.get('/:conversationId/messages', conversationController.getMessages);

// Archiver une conversation
router.put('/:conversationId/archive', conversationController.archiveConversation);

// Restaurer une conversation archivée
router.put('/:conversationId/unarchive', conversationController.unarchiveConversation);

// Quitter une conversation de groupe
router.put('/:conversationId/leave', conversationController.leaveConversation);

module.exports = router; 