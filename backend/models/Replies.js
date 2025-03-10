const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepliesSchema = new Schema({
  text: {
    type: String,
    required: true,
    maxlength: 280
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
  idTweet: {
    type: Schema.Types.ObjectId,
    ref: 'Tweet',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Replies', RepliesSchema); 