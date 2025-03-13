const mongoose = require('mongoose');
const Message = mongoose.model('Message');
const User = mongoose.model('User');

// Obtenir l'historique des messages entre deux utilisateurs
exports.getMessageHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    // Vérifier que les utilisateurs existent
    const [user, currentUser] = await Promise.all([
      User.findById(userId),
      User.findById(currentUserId)
    ]);
    
    if (!user || !currentUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Récupérer les messages dans les deux sens
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    })
    .sort({ createdAt: 1 }) // Tri chronologique
    .populate('sender', '_id username') // Enrichir avec les données de l'expéditeur
    .limit(100); // Limiter à 100 messages pour des raisons de performance
    
    return res.status(200).json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir la liste des conversations récentes
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Récupération des conversations pour l'utilisateur:", userId);
    
    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Convertir l'ID en ObjectId de manière sécurisée
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      console.error("Erreur de conversion d'ID:", err);
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }
    
    // Utiliser une méthode plus simple pour récupérer les messages et construire les conversations
    // Récupérer tous les messages impliquant l'utilisateur
    const allMessages = await Message.find({
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', '_id username photo')
    .populate('recipient', '_id username photo');
    
    console.log(`Messages trouvés: ${allMessages.length}`);
    
    // Regrouper les messages par conversation (autre participant)
    const conversationsMap = new Map();
    
    for (const message of allMessages) {
      // Déterminer l'autre participant
      const otherParticipant = message.sender._id.toString() === userId 
        ? message.recipient 
        : message.sender;
      
      const participantId = otherParticipant._id.toString();
      
      // Si cette conversation n'est pas encore dans la map, l'ajouter
      if (!conversationsMap.has(participantId)) {
        conversationsMap.set(participantId, {
          _id: participantId,
          participant: {
            _id: otherParticipant._id,
            username: otherParticipant.username,
            photo: otherParticipant.photo
          },
          lastMessage: message,
          unreadCount: message.recipient._id.toString() === userId && !message.read ? 1 : 0
        });
      } else if (message.recipient._id.toString() === userId && !message.read) {
        // Si le message n'est pas lu, incrémenter le compteur de messages non lus
        const conversation = conversationsMap.get(participantId);
        conversation.unreadCount += 1;
      }
    }
    
    // Convertir la map en tableau
    const conversations = Array.from(conversationsMap.values());
    
    console.log(`Conversations construites: ${conversations.length}`);
    return res.status(200).json(conversations);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Créer un nouveau message via API REST
exports.createMessage = async (req, res) => {
  try {
    const { recipient, content } = req.body;
    const senderId = req.user.id;

    console.log(`Création d'un message de ${senderId} à ${recipient}: ${content}`);
    
    if (!recipient || !content) {
      return res.status(400).json({ message: 'Destinataire et contenu requis' });
    }
    
    // Vérifier que les utilisateurs existent
    const [recipientUser, senderUser] = await Promise.all([
      User.findById(recipient),
      User.findById(senderId)
    ]);
    
    if (!recipientUser || !senderUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Créer le message
    const newMessage = new Message({
      sender: senderId,
      recipient,
      content
    });
    
    await newMessage.save();
    
    // Enrichir le message avec les infos du sender pour le retour
    const messageWithSender = {
      ...newMessage._doc,
      sender: {
        _id: senderUser._id,
        username: senderUser.username
      }
    };
    
    // Si Socket.io est configuré, envoyer une notification en temps réel
    if (global.io && global.userSocketMap) {
      const recipientSocketId = global.userSocketMap[recipient];
      if (recipientSocketId) {
        global.io.to(recipientSocketId).emit('new_message', messageWithSender);
      }
    }
    
    return res.status(201).json(messageWithSender);
  } catch (error) {
    console.error('Erreur lors de la création du message:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Marquer tous les messages d'une conversation comme lus
exports.markConversationAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    // Mettre à jour tous les messages non lus de l'autre utilisateur
    const result = await Message.updateMany(
      {
        sender: userId,
        recipient: currentUserId,
        read: false
      },
      { read: true }
    );
    
    return res.status(200).json({ 
      message: 'Messages marqués comme lus',
      count: result.nModified 
    });
  } catch (error) {
    console.error('Erreur lors du marquage des messages comme lus:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir le nombre total de messages non lus pour l'utilisateur
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Message.countDocuments({
      recipient: userId,
      read: false
    });
    
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Erreur lors du comptage des messages non lus:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
}; 