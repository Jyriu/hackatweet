const mongoose = require('mongoose');
const Conversation = mongoose.model('Conversation');
const Message = mongoose.model('Message');
const User = mongoose.model('User');

// Obtenir toutes les conversations d'un utilisateur
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer toutes les conversations où l'utilisateur est participant
    // et qui ne sont pas archivées par cet utilisateur
    const conversations = await Conversation.find({
      participants: userId,
      archivedBy: { $ne: userId }
    })
    .populate('lastMessage')
    .populate('participants', '_id username avatar')
    .sort({ updatedAt: -1 });
    
    // Transformer les données pour le client
    const formattedConversations = conversations.map(conv => {
      // Obtenir les informations sur les autres participants (pas l'utilisateur courant)
      const otherParticipants = conv.participants.filter(
        p => p._id.toString() !== userId
      );
      
      // Pour les conversations privées, utiliser le nom du participant comme nom de conversation
      const displayName = conv.isGroup 
        ? conv.name 
        : otherParticipants.length > 0 
          ? otherParticipants[0].username 
          : 'Conversation privée';
      
      // Récupérer le nombre de messages non lus pour cet utilisateur
      const unreadCount = conv.unreadCounts.get(userId.toString()) || 0;
      
      return {
        _id: conv._id,
        name: displayName,
        isGroup: conv.isGroup,
        participants: conv.participants,
        lastMessage: conv.lastMessage,
        unreadCount,
        updatedAt: conv.updatedAt,
        avatar: conv.isGroup ? conv.avatar : (otherParticipants[0]?.avatar || null)
      };
    });
    
    return res.status(200).json(formattedConversations);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Créer une nouvelle conversation
exports.createConversation = async (req, res) => {
  try {
    const { participants, name, isGroup } = req.body;
    const currentUserId = req.user.id;
    
    // Vérifier qu'il y a au moins un autre participant
    if (!participants || participants.length === 0) {
      return res.status(400).json({ message: 'Au moins un participant est requis' });
    }
    
    // Ajouter l'utilisateur courant aux participants s'il n'y est pas déjà
    const allParticipants = [...new Set([currentUserId, ...participants])];
    
    // Pour les conversations non-groupe entre 2 personnes, vérifier si elle existe déjà
    if (!isGroup && allParticipants.length === 2) {
      const existingConversation = await Conversation.findOrCreatePrivate(
        allParticipants[0], 
        allParticipants[1]
      );
      
      // Populer les participants pour la réponse
      await existingConversation.populate('participants', '_id username avatar');
      
      return res.status(200).json(existingConversation);
    }
    
    // Créer une nouvelle conversation (de groupe)
    if (isGroup && !name) {
      return res.status(400).json({ message: 'Un nom est requis pour les conversations de groupe' });
    }
    
    const newConversation = new Conversation({
      participants: allParticipants,
      name: isGroup ? name : undefined,
      isGroup: !!isGroup,
      admins: [currentUserId]
    });
    
    await newConversation.save();
    await newConversation.populate('participants', '_id username avatar');
    
    return res.status(201).json(newConversation);
  } catch (error) {
    console.error('Erreur lors de la création d\'une conversation:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir les détails d'une conversation
exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    })
    .populate('participants', '_id username avatar')
    .populate('lastMessage');
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    // Réinitialiser le compteur de messages non lus pour cet utilisateur
    await conversation.resetUnread(userId);
    
    return res.status(200).json(conversation);
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la conversation:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir les messages d'une conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    // Vérifier que l'utilisateur est participant de la conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée ou accès non autorisé' });
    }
    
    // Récupérer les messages avec pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 }) // Du plus récent au plus ancien
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', '_id username avatar');
    
    // Compter le total des messages pour la pagination
    const total = await Message.countDocuments({ conversation: conversationId });
    
    // Marquer automatiquement tous les messages comme lus par cet utilisateur
    // Uniquement s'ils ne sont pas déjà lus ET si l'utilisateur n'est pas l'expéditeur
    await Message.updateMany(
      { 
        conversation: conversationId,
        sender: { $ne: userId },
        read: false,
        readBy: { $ne: userId }
      },
      { 
        $set: { read: true },
        $addToSet: { readBy: userId }
      }
    );
    
    // Réinitialiser le compteur de messages non lus pour cet utilisateur
    await conversation.resetUnread(userId);
    
    return res.status(200).json({
      messages: messages.reverse(), // Inverser pour avoir l'ordre chronologique
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Archiver une conversation
exports.archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, participants: userId },
      { $addToSet: { archivedBy: userId } },
      { new: true }
    );
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    return res.status(200).json({ message: 'Conversation archivée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'archivage de la conversation:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Restaurer une conversation archivée
exports.unarchiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, participants: userId },
      { $pull: { archivedBy: userId } },
      { new: true }
    );
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    return res.status(200).json({ message: 'Conversation restaurée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la restauration de la conversation:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Quitter une conversation de groupe
exports.leaveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    // Vérifier que c'est une conversation de groupe
    if (!conversation.isGroup) {
      return res.status(400).json({ message: 'Impossible de quitter une conversation privée' });
    }
    
    // Retirer l'utilisateur des participants
    conversation.participants = conversation.participants.filter(
      p => p.toString() !== userId
    );
    
    // Retirer l'utilisateur des admins si nécessaire
    conversation.admins = conversation.admins.filter(
      a => a.toString() !== userId
    );
    
    await conversation.save();
    
    // Ajouter un message système pour informer les autres participants
    const systemMessage = new Message({
      conversation: conversationId,
      sender: userId,
      content: `${req.user.username} a quitté la conversation`,
      isGroupMessage: true,
      read: true
    });
    
    await systemMessage.save();
    
    return res.status(200).json({ message: 'Vous avez quitté la conversation' });
  } catch (error) {
    console.error('Erreur lors de la sortie de la conversation:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
}; 