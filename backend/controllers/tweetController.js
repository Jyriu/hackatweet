// Gestion des tweets 
const mongoose = require('mongoose');
const Tweet = mongoose.model('Tweet');
const User = mongoose.model('User');
const Replies = mongoose.model('Replies');

// Créer un nouveau tweet
exports.createTweet = async (req, res) => {
    try {
        const { text, mediaUrl, hashtags } = req.body;
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Le texte du tweet est requis' });
        }
        const newTweet = new Tweet({
            text,
            mediaUrl,
            author: req.user.id,
            userLikes: [],
            idcommentaires: [],
            hashtags,
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
        await tweet.remove();
        res.json({ message: 'Tweet supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du tweet:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du tweet', error: error.message });
    }
};

// Ajouter un like à un tweet
exports.likeTweet = async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id);
        const user = await User.findById(req.user.id);
        if (!tweet) {
            return res.status(404).json({ message: 'Tweet non trouvé' });
        }
        if (tweet.userLikes.includes(req.user.id)) {
            return res.status(400).json({ message: 'Vous avez déjà liké ce tweet' });
        }
        tweet.userLikes.push(req.user.id);
        user.likes.push(tweet.id);
        await user.save();
        await tweet.save();
        
        // Créer une notification pour l'auteur du tweet (si ce n'est pas l'utilisateur lui-même)
        if (tweet.author.toString() !== req.user.id) {
            await global.sendNotification({
                userId: tweet.author,
                type: 'like',
                triggeredBy: req.user.id,
                contentId: tweet._id,
                contentModel: 'Tweet',
                read: false
            });
        }
        
        res.json(tweet);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du like:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du like', error: error.message });
    }
};

// Retweeter un tweet
exports.retweet = async (req, res) => {
    try {
        const originalTweet = await Tweet.findById(req.params.id);
        if (!originalTweet) {
            return res.status(404).json({ message: 'Tweet non trouvé' });
        }
        const newTweet = new Tweet({
            text: originalTweet.text,
            mediaUrl: originalTweet.mediaUrl,
            author: req.user.id,
            userLikes: [],
            idcommentaires: [],
            hashtags: originalTweet.hashtags,
            retweets: [],
            originalTweet: originalTweet._id,
            date: new Date()
        });
        await newTweet.save();
        originalTweet.retweets.push({ user: req.user.id, date: new Date() });
        await originalTweet.save();
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
        res.status(201).json(newComment);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du commentaire:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du commentaire', error: error.message });
    }
};



