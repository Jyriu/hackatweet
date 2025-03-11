const mongoose = require('mongoose');
const Notification = mongoose.model('Notification');

// Récupérer toutes les notifications de l'utilisateur connecté
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('triggeredBy', 'username photo')
      .populate('contentId');
      
    console.log(`ℹ️ [Notification] ${notifications.length} notifications récupérées pour l'utilisateur ${req.user.id}`);
    res.json(notifications);
  } catch (error) {
    console.error(`📛 [Notification] Erreur lors de la récupération des notifications: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer les notifications non lues
exports.getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user.id,
      read: false 
    })
      .sort({ createdAt: -1 })
      .populate('triggeredBy', 'username photo')
      .populate('contentId');
      
    console.log(`ℹ️ [Notification] ${notifications.length} notifications non lues récupérées pour l'utilisateur ${req.user.id}`);
    res.json(notifications);
  } catch (error) {
    console.error(`📛 [Notification] Erreur lors de la récupération des notifications non lues: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer les notifications lues
exports.getReadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user.id,
      read: true 
    })
      .sort({ createdAt: -1 })
      .populate('triggeredBy', 'username photo')
      .populate('contentId');
      
    console.log(`ℹ️ [Notification] ${notifications.length} notifications lues récupérées pour l'utilisateur ${req.user.id}`);
    res.json(notifications);
  } catch (error) {
    console.error(`📛 [Notification] Erreur lors de la récupération des notifications lues: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, userId: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      console.warn(`⚠️ [Notification] Tentative de marquer une notification inexistante: ${req.params.notificationId}`);
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    console.log(`✅ [Notification] Notification ${req.params.notificationId} marquée comme lue par l'utilisateur ${req.user.id}`);
    res.json(notification);
  } catch (error) {
    console.error(`📛 [Notification] Erreur lors du marquage de la notification: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    
    console.log(`✅ [Notification] ${result.modifiedCount} notifications marquées comme lues pour l'utilisateur ${req.user.id}`);
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error(`📛 [Notification] Erreur lors du marquage de toutes les notifications: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer une notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      userId: req.user.id
    });
    
    if (!notification) {
      console.warn(`⚠️ [Notification] Tentative de suppression d'une notification inexistante: ${req.params.notificationId}`);
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    console.log(`✅ [Notification] Notification ${req.params.notificationId} supprimée par l'utilisateur ${req.user.id}`);
    res.json({ message: 'Notification supprimée avec succès' });
  } catch (error) {
    console.error(`📛 [Notification] Erreur lors de la suppression de la notification: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
}; 