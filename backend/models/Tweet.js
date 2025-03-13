const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TweetSchema = new Schema({
  text: {
    type: String,
    maxlength: 280,
  },
  mediaUrl: {
    type: String,
  },
  link: { // Add this field to store a link
    type: String,
    validate: {
      validator: function (v) {
        return /^https?:\/\/[^\s$.?#].[^\s]*$/.test(v); // Simple URL validation
      },
      message: props => `${props.value} is not a valid URL!`
    },
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userLikes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  usersave: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  idcommentaires: [
    {
      type: Schema.Types.ObjectId,
      ref: "Replies",
    },
  ],
  idmentions: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  hashtags: [
    {
      type: String,
    },
  ],
  retweets: [
    {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
  ],
  originalTweet: {
    type: Schema.Types.ObjectId,
    ref: "Tweet",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Tweet", TweetSchema);
