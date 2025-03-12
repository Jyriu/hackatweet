const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  // Référence à la conversation parente
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  
  // Expéditeur du message
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Destinataire du message (pourrait être redondant avec conversation.participants, mais utile pour les requêtes directes)
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // Requis seulement pour les messages directs (non groupes)
      return !this.isGroupMessage;
    }
  },
  
  // Contenu du message
  content: {
    type: String,
    required: true,
    trim: true
  },
  
  // Statut de lecture
  read: {
    type: Boolean,
    default: false
  },
  
  // Pour les messages de groupe (facultatif)
  isGroupMessage: {
    type: Boolean,
    default: false
  },
  
  // Utilisateurs qui ont lu le message (utile pour les groupes)
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Horodatage de création
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour rechercher rapidement les messages par conversation
messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ createdAt: -1 });

// Hook post-save pour mettre à jour la conversation
messageSchema.post('save', async function(doc) {
  try {
    const Conversation = mongoose.model('Conversation');
    
    // Mettre à jour lastMessage de la conversation
    await Conversation.findByIdAndUpdate(
      doc.conversation,
      { 
        lastMessage: doc._id,
        updatedAt: Date.now()
      }
    );
    
    // Pour les messages non lus, incrémenter le compteur pour chaque participant sauf l'expéditeur
    if (!doc.read) {
      const conversation = await Conversation.findById(doc.conversation);
      if (conversation) {
        // Pour chaque participant qui n'est pas l'expéditeur
        for (const participantId of conversation.participants) {
          if (participantId.toString() !== doc.sender.toString()) {
            // Incrémenter le compteur de messages non lus
            const userIdStr = participantId.toString();
            const currentCount = conversation.unreadCounts.get(userIdStr) || 0;
            conversation.unreadCounts.set(userIdStr, currentCount + 1);
          }
        }
        await conversation.save();
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la conversation après sauvegarde du message:', error);
  }
});

module.exports = mongoose.model('Message', messageSchema); 