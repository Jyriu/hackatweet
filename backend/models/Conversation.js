const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
  // Les participants à la conversation
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Référence au dernier message de la conversation
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Type de conversation
  isGroup: {
    type: Boolean,
    default: false
  },
  
  // Nom de la conversation (obligatoire uniquement pour les groupes)
  name: {
    type: String,
    required: function() { 
      return this.isGroup; 
    },
    trim: true
  },
  
  // Image/avatar de la conversation (optionnel)
  avatar: {
    type: String
  },
  
  // Compteurs de messages non lus par utilisateur
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // Utilisateurs qui ont archivé la conversation
  archivedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Administrateurs (pertinent uniquement pour les groupes)
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Horodatages
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pre-save pour mettre à jour l'horodatage
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index pour des recherches plus rapides
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

// Méthode pour ajouter un message non lu à un utilisateur
conversationSchema.methods.incrementUnread = async function(userId) {
  const userIdStr = userId.toString();
  const currentCount = this.unreadCounts.get(userIdStr) || 0;
  this.unreadCounts.set(userIdStr, currentCount + 1);
  return this.save();
};

// Méthode pour réinitialiser le compteur de messages non lus d'un utilisateur
conversationSchema.methods.resetUnread = async function(userId) {
  const userIdStr = userId.toString();
  this.unreadCounts.set(userIdStr, 0);
  return this.save();
};

// Méthode statique pour trouver ou créer une conversation privée
conversationSchema.statics.findOrCreatePrivate = async function(userId1, userId2) {
  // Rechercher une conversation existante entre ces deux utilisateurs
  const conversation = await this.findOne({
    participants: { $all: [userId1, userId2], $size: 2 },
    isGroup: false
  });
  
  if (conversation) {
    return conversation;
  }
  
  // Créer une nouvelle conversation
  return this.create({
    participants: [userId1, userId2],
    isGroup: false,
    admins: [userId1] // Créateur comme admin par défaut
  });
};

module.exports = mongoose.model('Conversation', conversationSchema); 