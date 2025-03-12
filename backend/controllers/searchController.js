const mongoose = require('mongoose');

const Tweet = mongoose.model('Tweet');
const User = mongoose.model('User');

// Recherche avancée
exports.advancedSearch = async (req, res) => {
    try {
        const { query, type, startDate, endDate, sortBy } = req.body;

        if (!query) {
            return res.status(400).json({ message: 'Terme de recherche requis' });
        }

        const regex = new RegExp(query, 'i');
        let results = {};
        let searchCriteria = {};
        let sortCriteria = {};

        if (startDate || endDate) {
            searchCriteria.date = {};
            if (startDate) {
                searchCriteria.date.$gte = new Date(startDate);
            }
            if (endDate) {
                searchCriteria.date.$lte = new Date(endDate);
            }
        }

        if (sortBy) {
            if (sortBy === 'date') {
                sortCriteria.date = -1;
            } else if (sortBy === 'popularity') {
                sortCriteria.userLikes = -1;
            }
        }

        if (type === 'hashtags') {
            searchCriteria.hashtags = regex;
            const tweets = await Tweet.find(searchCriteria).sort(sortCriteria).populate('author', 'username');
            results.hashtags = [...new Set(tweets.flatMap(tweet => tweet.hashtags.filter(hashtag => regex.test(hashtag))))];
        } else if (type === 'users') {
            searchCriteria = {
                $or: [
                    { username: regex },
                    { nom: regex },
                    { prenom: regex }
                ]
            };
            results.users = await User.find(searchCriteria).select('username nom prenom photo bio');
        } else if (type === 'tweets') {
            searchCriteria.text = regex;
            results.tweets = await Tweet.find(searchCriteria).sort(sortCriteria).populate('author', 'username');
        } else {
            searchCriteria.text = regex;
            results.tweets = await Tweet.find(searchCriteria).sort(sortCriteria).populate('author', 'username');
            searchCriteria.hashtags = regex;
            const tweets = await Tweet.find(searchCriteria).sort(sortCriteria).populate('author', 'username');
            // results.tweets = tweets;
            results.hashtags = [...new Set(tweets.flatMap(tweet => tweet.hashtags.filter(hashtag => regex.test(hashtag))))];
            searchCriteria = {
                $or: [
                    { username: regex },
                    { nom: regex },
                    { prenom: regex }
                ]
            };
            results.users = await User.find(searchCriteria).select('username nom prenom photo bio');
            searchCriteria.text = regex;
        }

        res.json(results);
    } catch (error) {
        console.error('Erreur lors de la recherche avancée:', error);
        res.status(500).json({ message: 'Erreur lors de la recherche avancée', error: error.message });
    }
};
