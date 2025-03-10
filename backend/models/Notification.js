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
    enum: ['like', 'retweet', 'commentaire', 'abonnement', 'mention'],
    required: true
  },
  tweetId: {
    type: Schema.Types.ObjectId,
    ref: 'Tweet'
  },
  followerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  replyId: {
    type: Schema.Types.ObjectId,
    ref: 'Commentaire'
  },
  read: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema); 