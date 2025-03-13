const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  read: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'audio', 'video'],
    },
    url: String,
    name: String,
    size: Number
  }],
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}  // Pour stocker des métadonnées additionnelles
  }
});

// Index pour rechercher rapidement les conversations
messageSchema.index({ conversation: 1 });
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ status: 1 }); // Pour rechercher par statut du message

// Middleware pour mettre à jour automatiquement le champ updatedAt
messageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Message', messageSchema); 