// Gestion des tweets
const mongoose = require("mongoose");
const Tweet = mongoose.model("Tweet");
const User = mongoose.model("User");
const Replies = mongoose.model("Replies");
const Emotion = mongoose.model("Emotion");

// Créer un nouveau tweet
/* exports.createTweet = async (req, res) => {
    try {

        const { text, mediaUrl } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Le texte du tweet est requis' });
        }


        // Extraction automatique des hashtags depuis le texte
        const hashtagRegex = /#(\w+)/g;
        const extractedHashtags = [];
        let hashtagMatch;
        while ((hashtagMatch = hashtagRegex.exec(text)) !== null) {
            extractedHashtags.push(hashtagMatch[1]);
        }


        // Extract mentions from the tweet text
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push(match[1]);
        }

        // Recherche des utilisateurs mentionnés
        const mentionedUsers = await User.find({ username: { $in: mentions } }).select('_id');
        const idmentions = mentionedUsers.map(user => user._id);

        const newTweet = new Tweet({
            text,
            mediaUrl,
            author: req.user.id,
            userLikes: [],
            idmentions,

            hashtags: extractedHashtags,

            hashtags: extractedHashtags, // Insertion des hashtags extraits automatiquement

            retweets: [],
            originalTweet: null,
            date: new Date()
        });
        await newTweet.save();
        res.status(201).json(newTweet);
    } catch (error) {
        console.error('Erreur lors de la création du tweet:', error);
        res.status(500).json({ message: 'Erreur lors de la création du tweet', error: error.message });
    }
};
 */

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Export the upload middleware
module.exports.upload = upload;
exports.createTweet = async (req, res) => {
  try {
    const { content, hashtags = [], mentions = [], link } = req.body; // Include `link`
    const author = req.user.id;

    // Handle file upload
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : "";

    // Convert mentions to user IDs
    const idmentions = await Promise.all(
      JSON.parse(mentions).map(async (username) => {
        const user = await User.findOne({ username });
        return user?._id;
      })
    );

    const newTweet = new Tweet({
      text: content,
      mediaUrl,
      link, // Add the link field here
      hashtags: JSON.parse(hashtags),
      idmentions: idmentions.filter((id) => id),
      author,
    });

    await newTweet.save();

    // Populate author information before sending response
    const populatedTweet = await Tweet.findById(newTweet._id)
      .populate("author", "username")
      .populate("idmentions", "username");

    res.status(201).json(populatedTweet);
  } catch (error) {
    console.error("Error creating tweet:", error);
    res.status(500).json({ message: "Error creating tweet" });
  }
};

// Récupérer tous les tweets triés par date
/* exports.getTweets = async (req, res) => {
    try {
        const tweets = await Tweet.find().populate('author', 'username').sort({ date: -1 }).limit(5);
        res.json(tweets);
    } catch (error) {
        console.error('Erreur lors de la récupération des tweets:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tweets', error: error.message });
    }
}; */

exports.getTweets = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    // 1. Find the user and their negative hashtags
    const user = await User.findById(userId);
    const negativeHashtags = user?.hashtagNegatif || [];

    // 2. Get seen tweet IDs
    const seenTweetIds = await Emotion.find({ user_id: userId }).distinct("tweet_id");

    let allMatchingTweets = [];
    let currentPage = parsedPage;

    while (allMatchingTweets.length < parsedLimit) {
      // 3. Build query for unseen tweets
      let query = Tweet.aggregate([
        {
          $match: {
            _id: { $nin: seenTweetIds },
          },
        },
        {
          $lookup: {
            from: "replies", // The collection name for comments
            localField: "_id",
            foreignField: "idTweet",
            as: "comments",
          },
        },
        {
          $addFields: {
            commentCount: { $size: "$comments" }, // Add comment count field
          },
        },
        {
          $sort: { date: -1 },
        },
        {
          $skip: (currentPage - 1) * parsedLimit,
        },
        {
          $limit: parsedLimit,
        },
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $lookup: {
            from: "tweets",
            localField: "originalTweet",
            foreignField: "_id",
            as: "originalTweet",
          },
        },
        {
          $unwind: {
            path: "$originalTweet",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "originalTweet.author",
            foreignField: "_id",
            as: "originalTweet.author",
          },
        },
        {
          $unwind: {
            path: "$originalTweet.author",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      const tweets = await query.exec();

      if (tweets.length === 0) {
        // No more tweets to fetch
        break;
      }

      // 5. Filter out tweets containing any negative hashtags
      const filteredTweets = tweets.filter((tweet) => {
        if (!tweet.hashtags) return true; // If no hashtags, keep the tweet
        return !tweet.hashtags.some((hashtag) => negativeHashtags.includes(hashtag));
      });

      // 6. Add filtered tweets to the result
      allMatchingTweets = [...allMatchingTweets, ...filteredTweets];

      if (allMatchingTweets.length >= parsedLimit) {
        // We have enough tweets
        break;
      }

      // 7. Increment the page for the next iteration
      currentPage++;

      // 8. Add processed tweets to seenTweetIds
      tweets.forEach((tweet) => {
        if (!seenTweetIds.includes(tweet._id)) {
          seenTweetIds.push(tweet._id);
        }
      });
    }

    // 9. Truncate the result to the requested limit
    const finalTweets = allMatchingTweets.slice(0, parsedLimit);

    // 10. Get the total number of tweets matching criteria
    const totalMatchingTweets = await Tweet.countDocuments({
      _id: { $nin: seenTweetIds },
      hashtags: { $not: { $in: negativeHashtags } },
    });

    const hasMore = totalMatchingTweets > parsedPage * parsedLimit;
    res.json({
      tweets: finalTweets,
      hasMore,
      total: totalMatchingTweets,
    });
  } catch (error) {
    console.error("Error fetching tweets:", error);
    res.status(500).json({
      message: "Error fetching tweets",
      error: error.message,
    });
  }
};

// Récupérer tous les tweets de l'utilisateur connecté
exports.getUserTweets = async (req, res) => {
  try {
    const tweets = await Tweet.find({ author: req.user.id }).populate(
      "author",
      "username"
    );
    res.json(tweets);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des tweets de l'utilisateur:",
      error
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des tweets de l'utilisateur",
      error: error.message,
    });
  }
};

// Récupérer les tweets likés par l'utilisateur connecté
exports.getLikedTweetsByUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const tweets = await Tweet.find({ _id: { $in: user.likes } }).populate(
      "author",
      "username"
    );
    res.json(tweets);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des tweets likés par l'utilisateur:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de la récupération des tweets likés par l'utilisateur",
      error: error.message,
    });
  }
};

// Récupérer un tweet par ID
exports.getTweetById = async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id).populate(
      "author",
      "username"
    );
    if (!tweet) {
      return res.status(404).json({ message: "Tweet non trouvé" });
    }
    res.json(tweet);
  } catch (error) {
    console.error("Erreur lors de la récupération du tweet:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération du tweet",
      error: error.message,
    });
  }
};

// Récupérer les tweets des personnes suivies par l'utilisateur connecté
exports.getFollowingTweets = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("following");
    const followingIds = user.following.map((following) => following._id);
    const tweets = await Tweet.find({ author: { $in: followingIds } }).populate(
      "author",
      "username"
    );
    res.json(tweets);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des tweets des personnes suivies:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de la récupération des tweets des personnes suivies",
      error: error.message,
    });
  }
};

// Récupérer les tweets likés par les abonnés de l'utilisateur connecté
exports.getLikedTweetsByFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("followers");
    const followerIds = user.followers.map((follower) => follower._id);
    const tweets = await Tweet.find({
      userLikes: { $in: followerIds },
    }).populate("author", "username");
    res.json(tweets);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des tweets likés par les abonnés:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de la récupération des tweets likés par les abonnés",
      error: error.message,
    });
  }
};

// Récupérer les tweets likés par les abonnements de l'utilisateur connecté
exports.getLikedTweetsByFollowings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("followers");
    const followingIds = user.following.map((follower) => follower._id);
    const tweets = await Tweet.find({
      userLikes: { $in: followingIds },
    }).populate("author", "username");
    res.json(tweets);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des tweets likés par les abonnés:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de la récupération des tweets likés par les abonnés",
      error: error.message,
    });
  }
};

// Récupérer les tweets commentés par les abonnements de l'utilisateur connecté
exports.getCommentedTweetsByFollowings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("following");
    const followingIds = user.following.map((following) => following._id);
    const tweets = await Tweet.find({
      idcommentaires: { $elemMatch: { author: { $in: followingIds } } },
    }).populate("author", "username");
    res.json(tweets);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des tweets commentés par les abonnements:",
      error
    );
    res.status(500).json({
      message:
        "Erreur lors de la récupération des tweets commentés par les abonnements",
      error: error.message,
    });
  }
};

// Récupérer tous les tweets des abonnements de l'utilisateur connecté (commentés, likés, et tweets)
exports.getAllTweetsByFollowings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("following");
    const followingIds = user.following.map((following) => following._id);

    // Récupérer les tweets des abonnements
    const tweets = await Tweet.find({ author: { $in: followingIds } }).populate(
      "author",
      "username"
    );

    // Récupérer les tweets likés par les abonnements
    const likedTweets = await Tweet.find({
      userLikes: { $in: followingIds },
    }).populate("author", "username");

    // Récupérer les tweets commentés par les abonnements
    const commentedTweets = await Tweet.find({
      idcommentaires: { $elemMatch: { author: { $in: followingIds } } },
    }).populate("author", "username");

    // Fusionner les résultats
    const allTweets = [...tweets, ...likedTweets, ...commentedTweets];

    // Supprimer les doublons
    const uniqueTweets = Array.from(
      new Set(allTweets.map((tweet) => tweet._id.toString()))
    ).map((id) => allTweets.find((tweet) => tweet._id.toString() === id));

    res.json(uniqueTweets);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des tweets des abonnements:",
      error
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des tweets des abonnements",
      error: error.message,
    });
  }
};
// Récupérer les tweets signet de l'utilisateur connecté
exports.getBookmarkedTweets = async (req, res) => {
  try {
    const user = await require("mongoose").model("User").findById(req.user.id);
    const Tweet = require("mongoose").model("Tweet");
    const tweets = await Tweet.find({ _id: { $in: user.signet } })
      .populate("author", "username photo")
      .sort({ date: -1 });
    res.json(tweets);
  } catch (error) {
    console.error("Erreur lors de la récupération des tweets signet:", error);
    res
      .status(500)
      .json({
        message: "Erreur lors de la récupération des tweets signet",
        error: error.message,
      });
  }
};

// Récupérer les tweets likés par l'utilisateur connecté
exports.getLikedTweetsByUser = async (req, res) => {
  try {
    const Tweet = require("mongoose").model("Tweet");
    // On cherche les tweets dont le champ userLikes contient l'ID de l'utilisateur connecté
    const tweets = await Tweet.find({ userLikes: { $in: [req.user.id] } })
      .populate("author", "username photo")
      .sort({ date: -1 });
    res.json(tweets);
  } catch (error) {
    console.error("Erreur lors de la récupération des tweets likés :", error);
    res
      .status(500)
      .json({
        message: "Erreur lors de la récupération des tweets likés",
        error: error.message,
      });
  }
};

// Récupérer les tweets commentés par l'utilisateur connecté
exports.getCommentedTweetsByUser = async (req, res) => {
  try {
    const Tweet = require("mongoose").model("Tweet");
    const tweets = await Tweet.find({
      idcommentaires: { $elemMatch: { author: req.user.id } },
    })
      .populate("author", "username photo")
      .sort({ date: -1 });
    res.json(tweets);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des tweets commentés :",
      error
    );
    res
      .status(500)
      .json({
        message: "Erreur lors de la récupération des tweets commentés",
        error: error.message,
      });
  }
};

// Mettre à jour un tweet
exports.updateTweet = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    const { content } = req.body;
    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) {
      return res.status(404).json({ message: "Tweet non trouvé" });
    }
    if (tweet.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }
    tweet.content = content;
    await tweet.save();
    res.json(tweet);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du tweet:", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour du tweet",
      error: error.message,
    });
  }
};

// Supprimer un tweet
exports.deleteTweet = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) {
      return res.status(404).json({ message: "Tweet non trouvé" });
    }
    if (tweet.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }
    await Tweet.deleteOne({ _id: req.params.id });
    res.json({ message: "Tweet supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du tweet:", error);
    res.status(500).json({
      message: "Erreur lors de la suppression du tweet",
      error: error.message,
    });
  }
};

// Supprimer tous les tweets (route d'administration)
exports.deleteAllTweets = async (req, res) => {
  try {
    await Tweet.deleteMany({});
    console.warn(
      `⚠️ [Tweet] TOUS LES TWEETS ont été supprimés par l'utilisateur ${req.user.id}`
    );
    res.json({ message: "Tous les tweets ont été supprimés avec succès" });
  } catch (error) {
    console.error(
      `📛 [Tweet] Erreur lors de la suppression de tous les tweets: ${error.message}`,
      error
    );
    res.status(500).json({
      message: "Erreur lors de la suppression de tous les tweets",
      error: error.message,
    });
  }
};

// Ajouter ou retirer un like à un tweet
exports.likeTweet = async (req, res) => {
  try {
    let tweet = await Tweet.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!tweet) {
      console.warn(
        `⚠️ [Tweet] Tentative de like d'un tweet inexistant: ${req.params.id}`
      );
      return res.status(404).json({ message: "Tweet non trouvé" });
    }

    if (tweet.userLikes.includes(req.user.id)) {
      // Retirer le like
      tweet.userLikes = tweet.userLikes.filter(
        (userId) => userId.toString() !== req.user.id
      );
    } else {
      // Ajouter le like
      tweet.userLikes.push(req.user.id);

      // Si l'utilisateur qui like n'est pas l'auteur du tweet, envoyer une notification
      if (tweet.author.toString() !== req.user.id) {
        await global.sendNotification({
          userId: tweet.author,
          type: "like",
          triggeredBy: req.user.id,
          contentId: tweet._id,
          contentModel: "Tweet",
          read: false,
        });
      }
    }

    await tweet.save();

    // Populate the tweet with necessary data
    tweet = await Tweet.findById(tweet._id)
      .populate("author", "username name profilePicture")
      .populate({
        path: "originalTweet",
        populate: {
          path: "author",
          select: "username name profilePicture",
        },
      })
      .populate("retweets")
      .lean();

    // Add any additional fields that might be needed
    tweet.isLiked = tweet.userLikes.includes(req.user.id);
    tweet.likeCount = tweet.userLikes.length;
    tweet.retweetCount = tweet.retweets.length;

    const message = tweet.userLikes.includes(req.user.id)
      ? "Tweet liké"
      : "Like retiré";
    res.json({ message, tweet });
  } catch (error) {
    console.error(`📛 [Tweet] Erreur lors du like: ${error.message}`, error);
    res.status(500).json({
      message: "Erreur lors de l'ajout du like",
      error: error.message,
    });
  }
};

// Retweeter un tweet
exports.retweet = async (req, res) => {
  try {
    const { text, mediaUrl, hashtags } = req.body;
    const originalTweet = await Tweet.findById(req.params.id);
    if (!originalTweet) {
      return res.status(404).json({ message: "Tweet non trouvé" });
    }

    let newTweet = new Tweet({
      text: text,
      mediaUrl: mediaUrl,
      author: req.user.id,
      userLikes: [],
      hashtags: hashtags,
      retweets: [],
      originalTweet: originalTweet._id,
      date: new Date(),
    });

    await newTweet.save();
    originalTweet.retweets.push(newTweet.id);
    await originalTweet.save();

    // Ajouter notification à l'auteur du tweet original
    if (originalTweet.author.toString() !== req.user.id) {
      await global.sendNotification({
        userId: originalTweet.author,
        type: "retweet",
        triggeredBy: req.user.id,
        contentId: originalTweet._id,
        contentModel: "Tweet",
        read: false,
      });
    }

    // Populate the new tweet with necessary data
    newTweet = await Tweet.findById(newTweet._id)
      .populate("author", "username name profilePicture")
      .populate({
        path: "originalTweet",
        populate: {
          path: "author",
          select: "username name profilePicture",
        },
      })
      .populate("retweets")
      .lean();

    // Add additional fields that might be needed
    newTweet.isLiked = false; // The new tweet has just been created, so it's not liked by the user
    newTweet.likeCount = 0;
    newTweet.retweetCount = newTweet.retweets.length;

    res.status(201).json(newTweet);
  } catch (error) {
    console.error("Erreur lors du retweet:", error);
    res
      .status(500)
      .json({ message: "Erreur lors du retweet", error: error.message });
  }
};

// Ajouter ou retirer un signet à un tweet
exports.bookmarkTweet = async (req, res) => {
  try {
    let tweet = await Tweet.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet non trouvé" });
    }

    const isBookmarked = user.signet.includes(req.params.id);

    if (isBookmarked) {
      // Remove bookmark
      user.signet = user.signet.filter(
        (tweetId) => tweetId.toString() !== req.params.id
      );
      tweet.usersave = tweet.usersave.filter(
        (userId) => userId.toString() !== req.user.id
      );
    } else {
      // Add bookmark
      user.signet.push(req.params.id);
      tweet.usersave.push(req.user.id);
    }

    await user.save();
    await tweet.save();

    // Fetch the updated tweet with all necessary information
    tweet = await Tweet.findById(req.params.id)
      .populate("author", "username name profilePicture")
      .populate({
        path: "originalTweet",
        populate: {
          path: "author",
          select: "username name profilePicture",
        },
      })
      .populate("retweets")
      .lean();

    // Add additional fields
    tweet.isBookmarked = !isBookmarked;
    tweet.bookmarkCount = tweet.usersave.length;
    tweet.retweetCount = tweet.retweets.length;
    tweet.likeCount = tweet.userLikes.length;

    const message = isBookmarked
      ? "Tweet retiré des signets"
      : "Tweet enregistré en signet";
    res.json({ message, tweet });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du tweet en signet:", error);
    res.status(500).json({
      message: "Erreur lors de l'enregistrement du tweet en signet",
      error: error.message,
    });
  }
};

exports.getTweetsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    // On récupère les tweets dont l'auteur correspond à userId, triés par date décroissante.
    const tweets = await Tweet.find({ author: userId })
      .populate("author", "username photo")
      .sort({ date: -1 });
    res.json(tweets);
  } catch (error) {
    console.error("Error fetching tweets by user:", error);
    res
      .status(500)
      .json({ message: "Error fetching tweets by user", error: error.message });
  }
};

//get all comments of a tweet
exports.getTweetComments = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const tweetId = req.params.id;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    const totalComments = await Replies.countDocuments({ idTweet: tweetId });

    const comments = await Replies.find({ idTweet: tweetId })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .sort({ date: -1 }) // Sort by date in descending order (newest first)
      .populate('author', 'username profilePicture'); // Populate the author field with username and profilePicture

    const totalPages = Math.ceil(totalComments / parsedLimit);

    res.status(200).json({
      comments,
      totalPages,
      currentPage: parsedPage,
    });
  } catch (error) {
    console.error('Error fetching tweet comments:', error);
    res.status(500).json({
      message: 'Error fetching tweet comments',
      error: error.message,
    });
  }
};

// get all hashtags shared on the last week, sorted by likes
exports.getRecentHashtagsSortedByLikes = async (req, res) => {
  try {
      const { startDate, endDate, limit = 100 } = req.query; // 'limit' récupéré depuis la requête, valeur par défaut = 10
      const matchConditions = {};
 
      if (startDate) {
          matchConditions.date = { $gte: new Date(startDate) };
      }
      if (endDate) {
          matchConditions.date = Object.assign(matchConditions.date || {}, { $lte: new Date(endDate) });
      }
 
      const pipeline = [
          { $match: matchConditions }, // Filtrer selon la date
          {
              $project: {
                  hashtags: 1,
                  likesCount: { $size: { $ifNull: ["$userLikes", []] } } // Calculer le nombre de likes pour chaque tweet
              }
          },
          { $unwind: "$hashtags" }, // Démanteler les hashtags pour pouvoir les grouper
          {
              $group: {
                  _id: "$hashtags", // Grouper par hashtag
                  totalLikes: { $sum: "$likesCount" }, // Somme des likes pour chaque hashtag
                  count: { $sum: 1 } // Nombre d'occurrences de ce hashtag
              }
          },
          { $sort: { totalLikes: -1 } }, // Trier par nombre de likes décroissant
          { $limit: parseInt(limit, req.query.limit) } // Limiter le nombre de résultats à 'limit'
      ];
 
      const hashtags = await Tweet.aggregate(pipeline);
      res.json(hashtags);
  } catch (error) {
      console.error('Error fetching recent hashtags:', error);
      res.status(500).json({
          message: 'Error fetching recent hashtags',
          error: error.message,
      });
  }
};