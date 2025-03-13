const mongoose = require('mongoose');
const Conversation = mongoose.model('Conversation');
const Message = mongoose.model('Message');
const User = mongoose.model('User');

// Obtenir toutes les conversations d'un utilisateur
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`Récupération des conversations pour l'utilisateur: ${userId}`);
    
    // Trouver toutes les conversations où l'utilisateur est participant
    const conversations = await Conversation.find({
      participants: userId
    })
    .sort({ updatedAt: -1 })
    .populate({
      path: 'participants',
      select: '_id username photo',
      match: { _id: { $ne: userId } } // On ne veut pas l'utilisateur courant
    })
    .populate({
      path: 'lastMessage',
      select: '_id content createdAt read'
    });

    // Formater les conversations pour le frontend
    const formattedConversations = conversations.map(conversation => {
      // L'autre participant est le premier (et normalement le seul) de la liste des participants
      // (puisqu'on a filtré l'utilisateur courant)
      const participant = conversation.participants[0];
      
      return {
        _id: conversation._id,
        participant: participant || { _id: 'utilisateur_supprimé', username: 'Utilisateur supprimé' },
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount?.get(userId.toString()) || 0,
        updatedAt: conversation.updatedAt
      };
    });
    
    console.log(`${formattedConversations.length} conversations trouvées`);
    
    return res.status(200).json(formattedConversations);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir les messages d'une conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Vérifier si la conversation existe et si l'utilisateur y participe
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée ou accès refusé' });
    }
    
    // Récupérer les messages de la conversation
    const messages = await Message.find({
      conversation: conversationId
    })
    .sort({ createdAt: 1 })
    .populate('sender', '_id username photo')
    .populate('recipient', '_id username photo')
    .limit(100);  // Limiter à 100 messages pour la performance
    
    // Marquer tous les messages comme lus
    const unreadMessages = messages.filter(
      msg => msg.recipient._id.toString() === userId && !msg.read
    );
    
    if (unreadMessages.length > 0) {
      // Mettre à jour les messages
      await Message.updateMany(
        {
          _id: { $in: unreadMessages.map(msg => msg._id) }
        },
        { read: true }
      );
      
      // Mettre à jour le compteur de messages non lus dans la conversation
      const unreadCount = conversation.unreadCount || new Map();
      unreadCount.set(userId.toString(), 0);
      await Conversation.updateOne(
        { _id: conversationId },
        { unreadCount }
      );
    }
    
    return res.status(200).json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Créer une nouvelle conversation ou en récupérer une existante
exports.createConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user.id;
    
    if (!recipientId) {
      return res.status(400).json({ message: 'ID du destinataire requis' });
    }
    
    if (recipientId === userId) {
      return res.status(400).json({ message: 'Impossible de créer une conversation avec soi-même' });
    }
    
    // Vérifier si le destinataire existe
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Destinataire non trouvé' });
    }
    
    // Vérifier si une conversation existe déjà entre ces deux utilisateurs
    const existingConversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] }
    })
    .populate({
      path: 'participants',
      select: '_id username photo',
      match: { _id: { $ne: userId } }
    });
    
    if (existingConversation) {
      return res.status(200).json({
        _id: existingConversation._id,
        participant: existingConversation.participants[0],
        lastMessage: existingConversation.lastMessage,
        unreadCount: existingConversation.unreadCount?.get(userId.toString()) || 0,
        updatedAt: existingConversation.updatedAt
      });
    }
    
    // Créer une nouvelle conversation
    const newConversation = new Conversation({
      participants: [userId, recipientId],
      unreadCount: new Map([[userId.toString(), 0], [recipientId.toString(), 0]]),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newConversation.save();
    
    // Récupérer les informations du destinataire pour la réponse
    const formattedConversation = {
      _id: newConversation._id,
      participant: {
        _id: recipient._id,
        username: recipient.username,
        photo: recipient.photo
      },
      unreadCount: 0,
      updatedAt: newConversation.updatedAt
    };
    
    return res.status(201).json(formattedConversation);
  } catch (error) {
    console.error('Erreur lors de la création de la conversation:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Envoyer un message dans une conversation
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const userId = req.user.id;
    
    if (!conversationId || !content) {
      return res.status(400).json({ message: 'ID de conversation et contenu requis' });
    }
    
    // Vérifier si la conversation existe et si l'utilisateur y participe
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée ou accès refusé' });
    }
    
    // Trouver l'autre participant
    const recipientId = conversation.participants.find(
      p => p.toString() !== userId
    );
    
    // Créer le message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      recipient: recipientId,
      content,
      read: false,
      createdAt: new Date()
    });
    
    await message.save();
    
    // Mettre à jour le dernier message et la date de mise à jour de la conversation
    // Et incrémenter le compteur de messages non lus pour le destinataire
    const unreadCount = conversation.unreadCount || new Map();
    const recipientUnread = unreadCount.get(recipientId.toString()) || 0;
    unreadCount.set(recipientId.toString(), recipientUnread + 1);
    
    await Conversation.updateOne(
      { _id: conversationId },
      { 
        lastMessage: message._id,
        updatedAt: new Date(),
        unreadCount
      }
    );
    
    // Récupérer les détails de l'expéditeur pour la réponse
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', '_id username photo')
      .populate('recipient', '_id username photo');
    
    // Envoyer la notification via WebSocket si disponible
    if (global.io && global.userSocketMap) {
      const recipientSocketId = global.userSocketMap[recipientId.toString()];
      if (recipientSocketId) {
        global.io.to(recipientSocketId).emit('new_message', {
          ...populatedMessage.toObject(),
          conversation: conversationId
        });
      }
    }
    
    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Marquer tous les messages d'une conversation comme lus
exports.markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Vérifier si la conversation existe et si l'utilisateur y participe
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée ou accès refusé' });
    }
    
    // Marquer tous les messages non lus adressés à l'utilisateur comme lus
    const result = await Message.updateMany(
      {
        conversation: conversationId,
        recipient: userId,
        read: false
      },
      { read: true }
    );
    
    // Mettre à jour le compteur de messages non lus dans la conversation
    const unreadCount = conversation.unreadCount || new Map();
    unreadCount.set(userId.toString(), 0);
    
    await Conversation.updateOne(
      { _id: conversationId },
      { unreadCount }
    );
    
    return res.status(200).json({
      message: 'Messages marqués comme lus',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Erreur lors du marquage des messages comme lus:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer une conversation
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Vérifier si la conversation existe et si l'utilisateur y participe
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée ou accès refusé' });
    }
    
    // Supprimer tous les messages de la conversation
    await Message.deleteMany({ conversation: conversationId });
    
    // Supprimer la conversation
    await Conversation.deleteOne({ _id: conversationId });
    
    return res.status(200).json({ message: 'Conversation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la conversation:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
}; 