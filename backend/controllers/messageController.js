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
    
    // Récupérer les derniers messages distincts par conversation
    const messages = await Message.aggregate([
      {
        // Filtrer pour inclure toutes les conversations où l'utilisateur est impliqué
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(userId) },
            { recipient: mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        // Trier par date décroissante pour avoir les plus récents d'abord
        $sort: { createdAt: -1 }
      },
      {
        // Créer un champ qui identifie l'autre participant
        $addFields: {
          otherParticipant: {
            $cond: {
              if: { $eq: ["$sender", mongoose.Types.ObjectId(userId)] },
              then: "$recipient",
              else: "$sender"
            }
          }
        }
      },
      {
        // Regrouper par conversation (autre participant)
        $group: {
          _id: "$otherParticipant",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ["$recipient", mongoose.Types.ObjectId(userId)] },
                  { $eq: ["$read", false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        // Joindre avec les informations utilisateur
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'participantInfo'
        }
      },
      {
        // Restructurer le résultat
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          participant: { $arrayElemAt: ["$participantInfo", 0] }
        }
      },
      {
        // Projeter seulement les champs nécessaires de l'utilisateur
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          participant: {
            _id: "$participant._id",
            username: "$participant.username"
          }
        }
      }
    ]);
    
    return res.status(200).json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
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