const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}  // Pour stocker le nombre de messages non lus par utilisateur: { "userId1": 3, "userId2": 0 }
  }
});

// Index pour rechercher rapidement les conversations par participant
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 }); // Pour trier par récence

module.exports = mongoose.model('Conversation', conversationSchema); 