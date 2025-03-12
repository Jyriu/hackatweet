const mongoose = require('mongoose');
const Message = mongoose.model('Message');
const User = mongoose.model('User');
const Conversation = mongoose.model('Conversation');

// Envoyer un nouveau message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user.id;
    
    // Si un ID de conversation est fourni, vérifier qu'elle existe et que l'utilisateur en est membre
    let conversation;
    
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        participants: senderId
      });
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation non trouvée ou accès non autorisé' });
      }
    } else if (recipientId) {
      // Si aucun ID de conversation n'est fourni mais un destinataire est spécifié,
      // trouver ou créer une conversation privée
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: 'Destinataire non trouvé' });
      }
      
      conversation = await Conversation.findOrCreatePrivate(senderId, recipientId);
    } else {
      return res.status(400).json({ message: 'Conversation ID ou Recipient ID requis' });
    }
    
    // Vérifier le contenu
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Le contenu du message ne peut pas être vide' });
    }
    
    // Créer le message
    const newMessage = new Message({
      conversation: conversation._id,
      sender: senderId,
      recipient: conversation.isGroup ? undefined : (conversation.participants.find(p => p.toString() !== senderId.toString())),
      content,
      isGroupMessage: conversation.isGroup
    });
    
    await newMessage.save();
    
    // Peupler le message avec les infos de l'expéditeur pour la réponse
    await newMessage.populate('sender', '_id username avatar');
    
    return res.status(201).json(newMessage);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Marquer un message comme lu
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }
    
    // Vérifier que l'utilisateur est bien le destinataire ou participant à la conversation
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(403).json({ message: 'Accès non autorisé à ce message' });
    }
    
    // Si l'utilisateur est l'expéditeur, pas besoin de marquer comme lu
    if (message.sender.toString() === userId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas marquer votre propre message comme lu' });
    }
    
    // Mettre à jour le message
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { 
        read: true,
        $addToSet: { readBy: userId }
      },
      { new: true }
    );
    
    // Réduire le compteur de messages non lus pour cet utilisateur
    await conversation.resetUnread(userId);
    
    return res.status(200).json(updatedMessage);
  } catch (error) {
    console.error('Erreur lors du marquage du message comme lu:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer un message (uniquement pour l'expéditeur)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }
    
    // Vérifier que l'utilisateur est bien l'expéditeur
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres messages' });
    }
    
    // Vérifier si c'est le dernier message de la conversation
    const conversation = await Conversation.findById(message.conversation);
    
    // Supprimer le message
    await Message.findByIdAndDelete(messageId);
    
    // Si c'était le dernier message, mettre à jour la référence dans la conversation
    if (conversation && conversation.lastMessage && conversation.lastMessage.toString() === messageId) {
      // Trouver le message précédent
      const previousMessage = await Message.findOne({
        conversation: conversation._id
      })
      .sort({ createdAt: -1 });
      
      if (previousMessage) {
        conversation.lastMessage = previousMessage._id;
      } else {
        conversation.lastMessage = null;
      }
      
      await conversation.save();
    }
    
    return res.status(200).json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir le nombre total de messages non lus pour l'utilisateur (toutes conversations confondues)
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer toutes les conversations de l'utilisateur
    const conversations = await Conversation.find({
      participants: userId
    });
    
    // Calculer le total des messages non lus à partir des compteurs de chaque conversation
    let totalUnread = 0;
    
    for (const conversation of conversations) {
      const unreadCount = conversation.unreadCounts.get(userId.toString()) || 0;
      totalUnread += unreadCount;
    }
    
    return res.status(200).json({ count: totalUnread });
  } catch (error) {
    console.error('Erreur lors du comptage des messages non lus:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
}; 