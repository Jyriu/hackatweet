const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['abonnement', 'like', 'retweet', 'commentaire', 'mention'],
    required: true
  },
  // L'utilisateur qui a déclenché la notification (celui qui like, commente, etc.)
  triggeredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Lien vers le contenu concerné (tweet, commentaire)
  contentId: {
    type: Schema.Types.ObjectId,
    refPath: 'contentModel'
  },
  // Type de contenu concerné ('Tweet' ou 'Replies')
  contentModel: {
    type: String,
    enum: ['Tweet', 'Replies'],
    default: 'Tweet'
  },
  // Statut de lecture de la notification
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema); 