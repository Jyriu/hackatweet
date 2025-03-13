const mongoose = require("mongoose");
const User = mongoose.model("User");
const Tweet = mongoose.model("Tweet");
const Notification = mongoose.model("Notification");

// Récupérer le profil d'un utilisateur par son username
exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .populate("followers", "_id username photo bio")
      .populate("following", "_id username photo bio")
      .select("-password");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


// Mettre à jour le profil utilisateur
exports.updateProfile = async (req, res) => {
  try {
    // Extraction des champs textuels depuis req.body
    const { bio, nom, prenom } = req.body;
    const userId = req.user.id;


    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`⚠️ [User] Tentative de mise à jour d'un utilisateur inexistant: ${userId}`);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }


    // Mettre à jour uniquement les champs fournis
    if (bio !== undefined) user.bio = bio;
    if (nom !== undefined) user.nom = nom;
    if (prenom !== undefined) user.prenom = prenom;

    // Traitement des fichiers uploadés via multer
    if (req.files && req.files.photo) {
      user.photo = "/uploads/" + req.files.photo[0].filename;
    }
    if (req.files && req.files.banner) {
      user.banner = "/uploads/" + req.files.banner[0].filename;
    }


    await user.save();
    console.log(`✅ [User] Profil mis à jour pour l'utilisateur ${userId}`);


    res.json({
      message: "Profil mis à jour avec succès",
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        username: user.username,
        photo: user.photo,
        banner: user.banner,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error(`📛 [User] Erreur lors de la mise à jour du profil: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Suivre un utilisateur
exports.followUser = async (req, res) => {
  try {
    const userToFollow = req.params.userToFollowId;
    const currentUser = req.user.id;

    // Vérifier que l'utilisateur n'essaie pas de s'abonner à lui-même
    if (userToFollow === currentUser) {
      console.warn(`⚠️ [User] Utilisateur ${currentUser} tente de s'abonner à lui-même`);
      return res.status(400).json({ message: 'Vous ne pouvez pas vous abonner à vous-même' });
    }

    // Vérifier que l'utilisateur à suivre existe
    const userToFollowDoc = await User.findById(userToFollow);
    if (!userToFollowDoc) {
      console.warn(`⚠️ [User] Tentative d'abonnement à un utilisateur inexistant: ${userToFollow}`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur est déjà abonné
    const currentUserDoc = await User.findById(currentUser);
    if (currentUserDoc.following.includes(userToFollow)) {
      console.warn(`⚠️ [User] Utilisateur ${currentUser} est déjà abonné à ${userToFollow}`);
      return res.status(400).json({ message: 'Vous suivez déjà cet utilisateur' });
    }

    // Ajouter l'utilisateur aux abonnements de l'utilisateur courant
    await User.findByIdAndUpdate(currentUser, {
      $push: { following: userToFollow }
    });

    // Ajouter l'utilisateur courant aux abonnés de l'utilisateur à suivre
    await User.findByIdAndUpdate(userToFollow, {
      $push: { followers: currentUser }
    });

    // Créer une notification pour informer l'utilisateur qu'il a un nouvel abonné
    await global.sendNotification({
      userId: userToFollow,
      type: 'abonnement',
      triggeredBy: currentUser,
      read: false
    });
    
    console.log(`✅ [User] Utilisateur ${currentUser} s'est abonné à ${userToFollow}`);
    res.json({ message: 'Abonnement réussi' });
  } catch (error) {
    console.error(`📛 [User] Erreur lors de l'abonnement: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur lors de l\'abonnement', error: error.message });
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
      console.warn(`⚠️ [User] Tentative d'unfollow d'un utilisateur inexistant: ${userToUnfollowId}`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }


    // Vérifier si l'utilisateur suit déjà la personne
    const user = await User.findById(userId);
    if (!user.following.includes(userToUnfollowId)) {
      console.warn(`⚠️ [User] Utilisateur ${userId} ne suit pas ${userToUnfollowId}`);
      return res.status(400).json({ message: 'Vous ne suivez pas cet utilisateur' });
    }


    // Retirer l'utilisateur à ne plus suivre de la liste des following de l'utilisateur actuel
    await User.findByIdAndUpdate(userId, {
      $pull: { following: userToUnfollowId },
    });


    // Retirer l'utilisateur actuel de la liste des followers de l'utilisateur à ne plus suivre
    await User.findByIdAndUpdate(userToUnfollowId, {
      $pull: { followers: userId },
    });

    console.log(`✅ [User] Utilisateur ${userId} a cessé de suivre ${userToUnfollowId}`);
    res.json({ message: 'Vous ne suivez plus cet utilisateur' });
  } catch (error) {
    console.error(`📛 [User] Erreur lors du unfollow: ${error.message}`, error);
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
      console.warn(`⚠️ [User] Utilisateur inexistant pour les suggestions: ${userId}`);
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
    
    console.log(`ℹ️ [User] ${suggestedUsers.length} utilisateurs suggérés pour ${userId}`);
    res.json(enhancedSuggestions);
  } catch (error) {
    console.error(`📛 [User] Erreur lors de la récupération des suggestions: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer la liste des abonnés d'un utilisateur
exports.getFollowers = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select('followers');

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }


    // Récupérer les détails de chaque abonné
    const followers = await User.find({
      _id: { $in: user.followers }
    }).select('_id nom prenom username photo bio');

    res.json(followers);
  } catch (error) {
    console.error("Erreur lors de la récupération des abonnés:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer la liste des abonnements d'un utilisateur
exports.getFollowing = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select('following');

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }


    // Récupérer les détails de chaque abonnement
    const following = await User.find({
      _id: { $in: user.following }
    }).select('_id nom prenom username photo bio');

    res.json(following);
  } catch (error) {
    console.error("Erreur lors de la récupération des abonnements:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
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

// Basculer un paramètre utilisateur (caméra, notifications, etc.)
exports.toggleUserSetting = async (req, res) => {
  try {
    const userId = req.user.id;
    const { setting } = req.params; // Le paramètre à modifier (cameraOn, notifOn, etc.)
    
    // Vérifier que le paramètre demandé est valide
    const validSettings = ['cameraOn', 'notifOn'];
    if (!validSettings.includes(setting)) {
      return res.status(400).json({ 
        message: `Paramètre invalide. Paramètres disponibles: ${validSettings.join(', ')}` 
      });
    }
    
    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Inverser la valeur actuelle du paramètre
    user[setting] = !user[setting];
    
    // Sauvegarder les modifications
    await user.save();
    
    // Préparer un message adapté au paramètre modifié
    let message = '';
    if (setting === 'cameraOn') {
      message = `Caméra ${user.cameraOn ? 'activée' : 'désactivée'} avec succès`;
    } else if (setting === 'notifOn') {
      message = `Notifications ${user.notifOn ? 'activées' : 'désactivées'} avec succès`;
    }
    
    // Retourner le statut mis à jour
    res.json({
      message,
      [setting]: user[setting]
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du paramètre:`, error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


// Récupérer les utilisateurs à suggerer pour la mention dans la creation d'un tweet
exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.query;
    const users = await User.find({ username: { $regex: query, $options: "i" } }).limit(5); // Limit to 5 suggestions
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Error searching users" });
  }
};

// récupérer l'utilisateur par son nom
// exports.getUserByUsername = async (req, res) => {
//   try {
//     const username = req.params.username;
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(user);
//   } catch (error) {
//     console.error("Error fetching user by username:", error);
//     res.status(500).json({ message: "Error fetching user" });
//   }
// };
