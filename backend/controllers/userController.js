const mongoose = require('mongoose');
const User = mongoose.model('User');
const Tweet = mongoose.model('Tweet');

// Récupérer le profil d'un utilisateur par son username
exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;


    const user = await User.findOne({ username }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }


    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour le profil utilisateur
exports.updateProfile = async (req, res) => {
  try {

    const { bio, photo, banner, nom, prenom } = req.body;
    const userId = req.user.id;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }


    // Mettre à jour uniquement les champs fournis
    if (bio !== undefined) user.bio = bio;
    if (photo !== undefined) user.photo = photo;
    if (banner !== undefined) user.banner = banner;
    if (nom !== undefined) user.nom = nom;
    if (prenom !== undefined) user.prenom = prenom;

    await user.save();

    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        username: user.username,
        photo: user.photo,
        banner: user.banner,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Suivre un utilisateur
exports.followUser = async (req, res) => {
  try {
    const { userToFollowId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur à suivre existe
    const userToFollow = await User.findById(userToFollowId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que l'utilisateur ne se suit pas lui-même
    if (userToFollowId === userId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous suivre vous-même' });
    }

    // Vérifier si l'utilisateur suit déjà la personne
    const user = await User.findById(userId);
    if (user.following.includes(userToFollowId)) {
      return res.status(400).json({ message: 'Vous suivez déjà cet utilisateur' });
    }

    // Ajouter l'utilisateur à suivre à la liste des following de l'utilisateur actuel
    await User.findByIdAndUpdate(userId, {
      $push: { following: userToFollowId }
    });

    // Ajouter l'utilisateur actuel à la liste des followers de l'utilisateur à suivre
    await User.findByIdAndUpdate(userToFollowId, {
      $push: { followers: userId }
    });

    // Créer une notification d'abonnement
    const Notification = mongoose.model('Notification');
    const newNotification = new Notification({
      userId: userToFollowId,
      type: 'abonnement',
      followerId: userId
    });


    await newNotification.save();

    res.json({ message: 'Vous suivez maintenant cet utilisateur' });
  } catch (error) {
    console.error('Erreur lors du suivi:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Ne plus suivre un utilisateur
exports.unfollowUser = async (req, res) => {
  try {
    const { userToUnfollowId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur à ne plus suivre existe
    const userToUnfollow = await User.findById(userToUnfollowId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur suit déjà la personne
    const user = await User.findById(userId);
    if (!user.following.includes(userToUnfollowId)) {
      return res.status(400).json({ message: 'Vous ne suivez pas cet utilisateur' });
    }

    // Retirer l'utilisateur à ne plus suivre de la liste des following de l'utilisateur actuel
    await User.findByIdAndUpdate(userId, {
      $pull: { following: userToUnfollowId }
    });

    // Retirer l'utilisateur actuel de la liste des followers de l'utilisateur à ne plus suivre
    await User.findByIdAndUpdate(userToUnfollowId, {
      $pull: { followers: userId }
    });

    res.json({ message: 'Vous ne suivez plus cet utilisateur' });
  } catch (error) {
    console.error('Erreur lors du unfollow:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer les utilisateurs suggérés de 2nd degré
exports.getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer l'utilisateur avec ses abonnements
    const user = await User.findById(userId).populate('following');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Récupérer les IDs des utilisateurs que l'utilisateur suit déjà
    const followingIds = user.following.map(f => f._id);
    
    // Trouver les utilisateurs suivis par les personnes que l'utilisateur suit (2ème degré)
    // mais que l'utilisateur ne suit pas encore et qui ne sont pas l'utilisateur lui-même
    const suggestedUsers = await User.aggregate([
      // Étape 1: Trouver tous les utilisateurs suivis par les personnes que l'utilisateur suit
      { $match: { _id: { $in: followingIds } } },
      { $project: { following: 1 } },
      { $unwind: '$following' },
      
      // Étape 2: Regrouper pour compter combien de fois chaque utilisateur apparaît
      // (= combien d'abonnements mutuels)
      { $group: { 
          _id: '$following', 
          mutualFollowers: { $sum: 1 },
          mutualFollowersList: { $push: '$_id' }
      }},
      
      // Étape 3: Filtrer pour exclure l'utilisateur lui-même et ceux qu'il suit déjà
      { $match: { 
          _id: { 
            $ne: mongoose.Types.ObjectId(userId),
            $nin: followingIds.map(id => mongoose.Types.ObjectId(id.toString()))
          } 
      }},
      
      // Étape 4: Trier par nombre d'abonnements mutuels (descendant)
      { $sort: { mutualFollowers: -1 } },
      
    ]);
    
    // Récupérer les détails complets des utilisateurs suggérés
    const suggestedUsersDetails = await User.find({
      _id: { $in: suggestedUsers.map(u => u._id) }
    }).select('_id nom prenom username photo bio');
    
    // Combiner les détails des utilisateurs avec les informations sur les abonnements mutuels
    const enhancedSuggestions = suggestedUsersDetails.map(user => {
      const suggestionInfo = suggestedUsers.find(s => s._id.equals(user._id));
      return {
        ...user.toObject(),
        mutualFollowers: suggestionInfo.mutualFollowers,
        mutualFollowersList: suggestionInfo.mutualFollowersList
      };
    });
    
    res.json(enhancedSuggestions);
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer la liste des abonnés d'un utilisateur
exports.getFollowers = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select('followers');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Récupérer les détails de chaque abonné
    const followers = await User.find({
      _id: { $in: user.followers }
    }).select('_id nom prenom username photo bio');

    res.json(followers);
  } catch (error) {
    console.error('Erreur lors de la récupération des abonnés:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer la liste des abonnements d'un utilisateur
exports.getFollowing = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select('following');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Récupérer les détails de chaque abonnement
    const following = await User.find({
      _id: { $in: user.following }
    }).select('_id nom prenom username photo bio');

    res.json(following);
  } catch (error) {
    console.error('Erreur lors de la récupération des abonnements:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour les mots-clés et hashtags basés sur l'analyse IA
exports.updateKeywordsFromAI = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      hashtagsPositifs, 
      hashtagsNegatifs, 
      motsclesPositifs, 
      motsclesNegatifs 
    } = req.body;
    
    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Mise à jour des tableaux avec $addToSet pour éviter les doublons
    // On utilise un tableau vide par défaut si undefined
    const update = {};
    
    if (hashtagsPositifs && hashtagsPositifs.length > 0) {
      update.$addToSet = { hashtagPositif: { $each: hashtagsPositifs } };
    }
    
    if (hashtagsNegatifs && hashtagsNegatifs.length > 0) {
      if (!update.$addToSet) update.$addToSet = {};
      update.$addToSet.hashtagNegatif = { $each: hashtagsNegatifs };
    }
    
    if (motsclesPositifs && motsclesPositifs.length > 0) {
      if (!update.$addToSet) update.$addToSet = {};
      update.$addToSet.motclefPositif = { $each: motsclesPositifs };
    }
    
    if (motsclesNegatifs && motsclesNegatifs.length > 0) {
      if (!update.$addToSet) update.$addToSet = {};
      update.$addToSet.motclefNegatif = { $each: motsclesNegatifs };
    }
    
    // Appliquer les mises à jour seulement si nécessaire
    if (Object.keys(update).length > 0) {
      await User.findByIdAndUpdate(userId, update);
    }
    
    // Récupérer l'utilisateur mis à jour
    const updatedUser = await User.findById(userId).select('-password');
    
    res.json({
      message: 'Mots-clés et hashtags mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des mots-clés:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};