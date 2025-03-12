// Gestion des tweets 
const mongoose = require('mongoose');
const Tweet = mongoose.model('Tweet');
const User = mongoose.model('User');
const Replies = mongoose.model('Replies');

// Créer un nouveau tweet
exports.createTweet = async (req, res) => {
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
            idcommentaires: [],
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


// Récupérer tous les tweets
exports.getTweets = async (req, res) => {
    try {
        const tweets = await Tweet.find().populate('author', 'username');
        res.json(tweets);
    } catch (error) {
        console.error('Erreur lors de la récupération des tweets:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tweets', error: error.message });
    }
};

// Récupérer tous les tweets de l'utilisateur connecté
exports.getUserTweets = async (req, res) => {
    try {
        const tweets = await Tweet.find({ author: req.user.id }).populate('author', 'username');
        res.json(tweets);
    } catch (error) {
        console.error('Erreur lors de la récupération des tweets de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tweets de l\'utilisateur', error: error.message });
    }
};

// Récupérer les tweets likés par l'utilisateur connecté
exports.getLikedTweetsByUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const tweets = await Tweet.find({ _id: { $in: user.likes } }).populate('author', 'username');
        res.json(tweets);
    } catch (error) {
        console.error('Erreur lors de la récupération des tweets likés par l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tweets likés par l\'utilisateur', error: error.message });
    }
};

// Récupérer un tweet par ID
exports.getTweetById = async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id).populate('author', 'username');
        if (!tweet) {
            return res.status(404).json({ message: 'Tweet non trouvé' });
        }
        res.json(tweet);
    } catch (error) {
        console.error('Erreur lors de la récupération du tweet:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du tweet', error: error.message });
    }
};

// Récupérer les tweets des personnes suivies par l'utilisateur connecté
exports.getFollowingTweets = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('following');
        const followingIds = user.following.map(following => following._id);
        const tweets = await Tweet.find({ author: { $in: followingIds } }).populate('author', 'username');
        res.json(tweets);
    } catch (error) {
        console.error('Erreur lors de la récupération des tweets des personnes suivies:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tweets des personnes suivies', error: error.message });
    }
};

// Récupérer les tweets likés par les abonnés de l'utilisateur connecté
exports.getLikedTweetsByFollowers = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('followers');
        const followerIds = user.followers.map(follower => follower._id);
        const tweets = await Tweet.find({ userLikes: { $in: followerIds } }).populate('author', 'username');
        res.json(tweets);
    } catch (error) {
        console.error('Erreur lors de la récupération des tweets likés par les abonnés:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tweets likés par les abonnés', error: error.message });
    }
};

// Récupérer les tweets likés par les abonnements de l'utilisateur connecté
exports.getLikedTweetsByFollowings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('followers');
        const followingIds = user.following.map(follower => follower._id);
        const tweets = await Tweet.find({ userLikes: { $in: followingIds } }).populate('author', 'username');
        res.json(tweets);
    } catch (error) {
        console.error('Erreur lors de la récupération des tweets likés par les abonnés:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tweets likés par les abonnés', error: error.message });
    }
};


// Mettre à jour un tweet
exports.updateTweet = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        const { content } = req.body;
        const tweet = await Tweet.findById(req.params.id);
        if (!tweet) {
            return res.status(404).json({ message: 'Tweet non trouvé' });
        }
        if (tweet.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        tweet.content = content;
        await tweet.save();
        res.json(tweet);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du tweet:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du tweet', error: error.message });
    }
};

// Supprimer un tweet
exports.deleteTweet = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        const tweet = await Tweet.findById(req.params.id);
        if (!tweet) {
            return res.status(404).json({ message: 'Tweet non trouvé' });
        }
        if (tweet.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        await Tweet.deleteOne({ _id: req.params.id });
        res.json({ message: 'Tweet supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du tweet:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du tweet', error: error.message });
    }
};

// Supprimer tous les tweets (route d'administration)
exports.deleteAllTweets = async (req, res) => {
    try {
        await Tweet.deleteMany({});
        console.warn(`⚠️ [Tweet] TOUS LES TWEETS ont été supprimés par l'utilisateur ${req.user.id}`);
        res.json({ message: 'Tous les tweets ont été supprimés avec succès' });
    } catch (error) {
        console.error(`📛 [Tweet] Erreur lors de la suppression de tous les tweets: ${error.message}`, error);
        res.status(500).json({ message: 'Erreur lors de la suppression de tous les tweets', error: error.message });
    }
};

// Ajouter ou retirer un like à un tweet
exports.likeTweet = async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id);
        const user = await User.findById(req.user.id);

        if (!tweet) {
            console.warn(`⚠️ [Tweet] Tentative de like d'un tweet inexistant: ${req.params.id}`);
            return res.status(404).json({ message: 'Tweet non trouvé' });
        }

        if (tweet.userLikes.includes(req.user.id)) {
            // Retirer le like
            tweet.userLikes = tweet.userLikes.filter(userId => userId.toString() !== req.user.id);
            await tweet.save();
            console.log(`✅ [Tweet] Like retiré par ${req.user.id} pour le tweet ${tweet._id}`);
            return res.json({ message: 'Like retiré', tweet });
        } else {
            // Ajouter le like
            tweet.userLikes.push(req.user.id);
            await tweet.save();

            // Si l'utilisateur qui like n'est pas l'auteur du tweet, envoyer une notification
            if (tweet.author.toString() !== req.user.id) {
                await global.sendNotification({
                    userId: tweet.author,
                    type: 'like',
                    triggeredBy: req.user.id,
                    contentId: tweet._id,
                    contentModel: 'Tweet',
                    read: false
                });
                console.log(`✅ [Tweet] Like + notification envoyée de ${req.user.id} à ${tweet.author} pour le tweet ${tweet._id}`);
            } else {
                console.log(`✅ [Tweet] Like sans notification (auteur = liker) pour le tweet ${tweet._id}`);
            }

            return res.json({ message: 'Tweet liké', tweet });
        }
    } catch (error) {
        console.error(`📛 [Tweet] Erreur lors du like: ${error.message}`, error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du like', error: error.message });
    }
};

// Retweeter un tweet
exports.retweet = async (req, res) => {
    try {
        const { text, mediaUrl, hashtags } = req.body;
        const originalTweet = await Tweet.findById(req.params.id);
        if (!originalTweet) {
            return res.status(404).json({ message: 'Tweet non trouvé' });
        }
        const newTweet = new Tweet({
            text: text,
            mediaUrl: mediaUrl,
            author: req.user.id,
            userLikes: [],
            idcommentaires: [],
            hashtags: hashtags,
            retweets: [],
            originalTweet: originalTweet._id,
            date: new Date()
        });
        await newTweet.save();
        originalTweet.retweets.push(newTweet.id);
        await originalTweet.save();

        // Ajouter notification à l'auteur du tweet original
        if (originalTweet.author.toString() !== req.user.id) {
            await global.sendNotification({
                userId: originalTweet.author,
                type: 'retweet',
                triggeredBy: req.user.id,
                contentId: originalTweet._id,
                contentModel: 'Tweet',
                read: false
            });
        }

        res.status(201).json(newTweet);
    } catch (error) {
        console.error('Erreur lors du retweet:', error);
        res.status(500).json({ message: 'Erreur lors du retweet', error: error.message });
    }
};

// Ajouter un commentaire à un tweet
exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Le texte du commentaire est requis' });
        }
        const tweet = await Tweet.findById(req.params.id);
        if (!tweet) {
            return res.status(404).json({ message: 'Tweet non trouvé' });
        }
        const newComment = new Replies({
            text,
            author: req.user.id,
            idTweet: tweet._id,
            date: new Date()
        });
        await newComment.save();
        tweet.idcommentaires.push(newComment._id);
        await tweet.save();

        // Ajouter notification à l'auteur du tweet
        if (tweet.author.toString() !== req.user.id) {
            await global.sendNotification({
                userId: tweet.author,
                type: 'commentaire',
                triggeredBy: req.user.id,
                contentId: tweet._id,
                contentModel: 'Tweet',
                read: false
            });
        }

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du commentaire:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du commentaire', error: error.message });
    }
};

// Répondre à un commentaire
exports.replyToComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Le texte de la réponse est requis' });
        }
        const comment = await Replies.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: 'Commentaire non trouvé' });
        }
        const newReply = new Replies({
            text,
            author: req.user.id,
            idComment: comment._id,
            date: new Date()
        });
        await newReply.save();
        comment.replies = comment.replies || [];
        comment.replies.push(newReply._id);
        await comment.save();

        // Ajouter notification à l'auteur du commentaire
        if (comment.author.toString() !== req.user.id) {
            await global.sendNotification({
                userId: comment.author,
                type: 'reply',
                triggeredBy: req.user.id,
                contentId: comment._id,
                contentModel: 'Replies',
                read: false
            });
        }

        res.status(201).json(newReply);
    } catch (error) {
        console.error('Erreur lors de la réponse au commentaire:', error);
        res.status(500).json({ message: 'Erreur lors de la réponse au commentaire', error: error.message });
    }
};


// Ajouter un like à un commentaire
exports.likeComment = async (req, res) => {
    try {
        const comment = await Replies.findById(req.params.id);
        const user = await User.findById(req.user.id);
        if (!comment) {
            console.warn(`⚠️ [Tweet] Tentative de like d'un commentaire inexistant: ${req.params.id}`);
            return res.status(404).json({ message: 'Commentaire non trouvé' });
        }
        if (comment.userLikes.includes(req.user.id)) {
            console.warn(`⚠️ [Tweet] Utilisateur ${req.user.id} a déjà liké le commentaire ${req.params.id}`);
            return res.status(400).json({ message: 'Vous avez déjà liké ce commentaire' });
        }
        comment.userLikes.push(req.user.id);
        user.likes.push(comment.id);
        await user.save();
        await comment.save();

        // Ajouter notification à l'auteur du commentaire
        if (comment.author.toString() !== req.user.id) {
            await global.sendNotification({
                userId: comment.author,
                type: 'like',
                triggeredBy: req.user.id,
                contentId: comment._id,
                contentModel: 'Replies',
                read: false
            });
            console.log(`✅ [Tweet] Like + notification envoyée de ${req.user.id} à ${comment.author} pour le commentaire ${comment._id}`);
        } else {
            console.log(`✅ [Tweet] Like sans notification (auteur = liker) pour le commentaire ${comment._id}`);
        }

        res.json(comment);
    } catch (error) {
        console.error(`📛 [Tweet] Erreur lors du like d'un commentaire: ${error.message}`, error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du like', error: error.message });
    }
};

// Récupérer tous les commentaires d'un tweet
exports.getComments = async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id).populate({
            path: 'idcommentaires',
            populate: {
                path: 'author',
                select: 'username nom prenom photo'
            }
        });

        if (!tweet) {
            return res.status(404).json({ message: 'Tweet non trouvé' });
        }

        res.json(tweet.idcommentaires);
    } catch (error) {
        console.error('Erreur lors de la récupération des commentaires:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des commentaires', error: error.message });
    }
};

// Modifier un commentaire
exports.updateComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Le texte du commentaire est requis' });
        }
        const comment = await Replies.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: 'Commentaire non trouvé' });
        }
        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        comment.text = text;
        await comment.save();
        res.json(comment);
    } catch (error) {
        console.error('Erreur lors de la modification du commentaire:', error);
        res.status(500).json({ message: 'Erreur lors de la modification du commentaire', error: error.message });
    }
};


