const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/authMiddleware');

// Récupérer toutes les notifications de l'utilisateur connecté
router.get('/', auth, notificationController.getNotifications);

// Récupérer les notifications non lues
router.get('/unread', auth, notificationController.getUnreadNotifications);

// Récupérer les notifications lues
router.get('/read', auth, notificationController.getReadNotifications);

// Marquer une notification comme lue
router.put('/:notificationId/read', auth, notificationController.markAsRead);

// Marquer toutes les notifications comme lues
router.put('/mark-all-read', auth, notificationController.markAllAsRead);

// Supprimer une notification
router.delete('/:notificationId', auth, notificationController.deleteNotification);

module.exports = router; 