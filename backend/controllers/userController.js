const mongoose = require('mongoose');
const User = mongoose.model('User');
const Tweet = mongoose.model('Tweet');

// Récupérer le profil d'un utilisateur par son username
exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
<<<<<<< HEAD

    const user = await User.findOne({ username }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

=======
    
    const user = await User.findOne({ username }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour le profil utilisateur
exports.updateProfile = async (req, res) => {
  try {
<<<<<<< HEAD
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    const { bio, photo, nom, prenom } = req.body;
    const userId = req.user.id;

=======
    const { bio, photo, banner, nom, prenom } = req.body;
    const userId = req.user.id;
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
<<<<<<< HEAD

    // Mettre à jour uniquement les champs fournis
    if (bio !== undefined) user.bio = bio;
    if (photo !== undefined) user.photo = photo;
    if (nom !== undefined) user.nom = nom;
    if (prenom !== undefined) user.prenom = prenom;

    await user.save();

=======
    
    // Mettre à jour uniquement les champs fournis
    if (bio !== undefined) user.bio = bio;
    if (photo !== undefined) user.photo = photo;
    if (banner !== undefined) user.banner = banner;
    if (nom !== undefined) user.nom = nom;
    if (prenom !== undefined) user.prenom = prenom;
    
    await user.save();
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        username: user.username,
        photo: user.photo,
<<<<<<< HEAD
=======
        banner: user.banner,
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
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
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Vérifier que l'utilisateur à suivre existe
    const userToFollow = await User.findById(userToFollowId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Vérifier que l'utilisateur ne se suit pas lui-même
    if (userToFollowId === userId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous suivre vous-même' });
    }
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Vérifier si l'utilisateur suit déjà la personne
    const user = await User.findById(userId);
    if (user.following.includes(userToFollowId)) {
      return res.status(400).json({ message: 'Vous suivez déjà cet utilisateur' });
    }
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Ajouter l'utilisateur à suivre à la liste des following de l'utilisateur actuel
    await User.findByIdAndUpdate(userId, {
      $push: { following: userToFollowId }
    });
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Ajouter l'utilisateur actuel à la liste des followers de l'utilisateur à suivre
    await User.findByIdAndUpdate(userToFollowId, {
      $push: { followers: userId }
    });
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Créer une notification d'abonnement
    const Notification = mongoose.model('Notification');
    const newNotification = new Notification({
      userId: userToFollowId,
      type: 'abonnement',
      followerId: userId
    });
<<<<<<< HEAD

    await newNotification.save();

=======
    
    await newNotification.save();
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
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
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Vérifier que l'utilisateur à ne plus suivre existe
    const userToUnfollow = await User.findById(userToUnfollowId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Vérifier si l'utilisateur suit déjà la personne
    const user = await User.findById(userId);
    if (!user.following.includes(userToUnfollowId)) {
      return res.status(400).json({ message: 'Vous ne suivez pas cet utilisateur' });
    }
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Retirer l'utilisateur à ne plus suivre de la liste des following de l'utilisateur actuel
    await User.findByIdAndUpdate(userId, {
      $pull: { following: userToUnfollowId }
    });
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Retirer l'utilisateur actuel de la liste des followers de l'utilisateur à ne plus suivre
    await User.findByIdAndUpdate(userToUnfollowId, {
      $pull: { followers: userId }
    });
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    res.json({ message: 'Vous ne suivez plus cet utilisateur' });
  } catch (error) {
    console.error('Erreur lors du unfollow:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer les utilisateurs suggérés (ceux que l'utilisateur ne suit pas encore)
exports.getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    // Récupérer les utilisateurs que l'utilisateur actuel ne suit pas encore
    // et qui ne sont pas l'utilisateur lui-même
    const suggestedUsers = await User.find({
      _id: { $nin: [...user.following, userId] }
    })
<<<<<<< HEAD
      .select('_id nom prenom username photo bio')
      .limit(5);

=======
    .select('_id nom prenom username photo bio')
    .limit(5);
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    res.json(suggestedUsers);
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Rechercher des utilisateurs par nom d'utilisateur ou nom/prénom
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
<<<<<<< HEAD

    if (!query) {
      return res.status(400).json({ message: 'Terme de recherche requis' });
    }

=======
    
    if (!query) {
      return res.status(400).json({ message: 'Terme de recherche requis' });
    }
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { nom: { $regex: query, $options: 'i' } },
        { prenom: { $regex: query, $options: 'i' } }
      ]
    })
<<<<<<< HEAD
      .select('_id nom prenom username photo bio')
      .limit(10);

=======
    .select('_id nom prenom username photo bio')
    .limit(10);
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer les tweets likés par un utilisateur
exports.getLikedTweets = async (req, res) => {
  try {
    const { username } = req.params;
<<<<<<< HEAD

=======
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
<<<<<<< HEAD

    const likedTweets = await Tweet.find({
      _id: { $in: user.likes }
    })
      .populate('author', '_id nom prenom username photo')
      .sort({ date: -1 });

=======
    
    const likedTweets = await Tweet.find({
      _id: { $in: user.likes }
    })
    .populate('author', '_id nom prenom username photo')
    .sort({ date: -1 });
    
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
    res.json(likedTweets);
  } catch (error) {
    console.error('Erreur lors de la récupération des tweets likés:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
<<<<<<< HEAD
=======
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
>>>>>>> 5f84d79919e8602a5495baccdd165a20cf58c033
};