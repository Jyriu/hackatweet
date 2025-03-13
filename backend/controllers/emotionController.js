const mongoose = require('mongoose');
const Tweet = mongoose.model('Tweet');
const User = mongoose.model('User');
const Emotion = mongoose.model('Emotion');
const Replies = mongoose.model('Replies');


// controllers/emotionController.js
exports.saveEmotion = async (req, res) => {
    try {
      const { tweet_id, user_id, emotion } = req.body;
      if(!emotion){
        return res.status(200).json({ message: 'AI not activated' });
      }

      const existingEmotion = await Emotion.findOne({ tweet_id, user_id });

      if (existingEmotion) {
        return res.status(200).json({ message: 'Emotion already exists for this user and tweet' });
      }else{
        // Save the emotion to the emotions table
      const newEmotion = new Emotion({ tweet_id, user_id, emotion });
      await newEmotion.save();
  
      const tweet = await Tweet.findById(tweet_id);
      const user = await User.findById(user_id);

      if(user && tweet){
        //Update the user's positive_hashtags based on the emotion
        if(emotion === 'happy' || emotion === 'surprise' || emotion === 'neutral'){
          tweet.hashtags.forEach((hashtag) => {
            if (!user.hashtagPositif.includes(hashtag)) {
              user.hashtagPositif.push(hashtag);
            }
          });

        }
        // update the user's negative_hashtags based on the emotion
        else{
          tweet.hashtags.forEach((hashtag) => {
            if (!user.hashtagNegatif.includes(hashtag)) {
              user.hashtagNegatif.push(hashtag);
            }
          });

        }
        await user.save();

      }

      
   
      return res.status(201).json({ message: 'Emotion saved successfully' });

      }

  
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'émotion:', error);
      res.status(500).json({ message: 'Erreur lors de la sauvegarde de l\'émotion', error: error.message });
    }
  };