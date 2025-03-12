const mongoose = require('mongoose');
const Tweet = mongoose.model('Tweet');
const User = mongoose.model('User');
const Replies = mongoose.model('Replies');

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
        if (!comment) {
            return res.status(404).json({ message: 'Commentaire non trouvé' });
        }

        const userId = req.user.id;
        const userLikesIndex = comment.userLikes.indexOf(userId);

        if (userLikesIndex !== -1) {
            // Retirer le like
            comment.userLikes.splice(userLikesIndex, 1);
            await User.findByIdAndUpdate(userId, { $pull: { likes: comment.id } });
            await comment.save();
            return res.json({ message: 'Like retiré', comment });
        }

        // Ajouter le like
        comment.userLikes.push(userId);
        await User.findByIdAndUpdate(userId, { $addToSet: { likes: comment.id } });
        await comment.save();

        // Ajouter notification à l'auteur du commentaire
        if (comment.author.toString() !== userId) {
            await global.sendNotification({
                userId: comment.author,
                type: 'like',
                triggeredBy: userId,
                contentId: comment._id,
                contentModel: 'Replies',
                read: false
            });
        }

        res.json(comment);
    } catch (error) {
        console.error(`Erreur lors du like d'un commentaire: ${error.message}`, error);
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
