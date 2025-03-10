// Gestion des tweets 
const mongoose = require('mongoose');
const Tweet = mongoose.model('Tweet');
const User = mongoose.model('User');


// Créer un nouveau tweet
exports.createTweet = async (req, res) => {
    try {
        const { text } = req.body;
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Le texte du tweet est requis' });
        }
        const newTweet = new Tweet({
            text,
            author: req.user.id
        });
        await newTweet.save();
        console.log('Tweet saved:', newTweet); // Log the saved tweet
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

// Inscription d'un nouvel tweet
