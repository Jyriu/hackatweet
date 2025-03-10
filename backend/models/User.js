const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  photo: {
    type: String,
    default: 'default-profile.png'
  },
  cameraOn: {
    type: Boolean,
    default: false
  },
  notifOn: {
    type: Boolean,
    default: true
  },
  bio: {
    type: String,
    default: '',
    maxlength: 160
  },
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'Tweet'
  }],
  signet: [{
    type: Schema.Types.ObjectId,
    ref: 'Tweet'
  }],
  history: [{
    tweet: {
      type: Schema.Types.ObjectId,
      ref: 'Tweet'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: { 
    createdAt: 'date_create', 
    updatedAt: 'date_update' 
  }
});

module.exports = mongoose.model('User', UserSchema); 