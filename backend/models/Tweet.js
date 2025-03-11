const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TweetSchema = new Schema({
  text: {
    type: String,
    required: true,
    maxlength: 280
  },
  mediaUrl: {
    type: String
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userLikes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  idcommentaires: [{
    type: Schema.Types.ObjectId,
    ref: 'Replies'
  }],
  hashtags: [{
    type: String
  }],
  retweets: [{
    type: Schema.Types.ObjectId,
    ref: 'Tweet'
  }],
  originalTweet: {
    type: Schema.Types.ObjectId,
    ref: 'Tweet'
  },
  date: {
    type: Date,
    default: Date.now
  }
});


module.exports = mongoose.model('Tweet', TweetSchema); 
