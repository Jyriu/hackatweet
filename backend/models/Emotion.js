const mongoose = require('mongoose');

const EmotionSchema = new mongoose.Schema(
    {
        tweet_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tweet',
            required: true
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        emotion: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true 
    }
);

module.exports = mongoose.model('Emotion', EmotionSchema);
