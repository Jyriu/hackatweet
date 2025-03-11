const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.model('User');

// Fonction utilitaire pour générer un token JWT
const generateToken = (userId) => {
  console.log(`ℹ️ [Auth] Génération de token pour l'utilisateur ${userId}`);
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const { email, password, nom, prenom, username, bio } = req.body;

    // Vérifier si l'email existe déjà
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Vérifier si le nom d'utilisateur existe déjà
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
    }

    // Hachage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Création du nouvel utilisateur
    const newUser = new User({
      email,
      password: hashedPassword,
      nom,
      prenom,
      username,
      bio: bio || '',
      banner: 'default-banner.png'
    });

    // Sauvegarde de l'utilisateur
    await newUser.save();

    // Génération du token JWT
    const token = jwt.sign(
      { id: newUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Envoi de la réponse
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        username: newUser.username,
        photo: newUser.photo,
        banner: newUser.banner,
        bio: newUser.bio
      }
    });
  } catch (error) {
    console.error(`📛 [Auth] Erreur lors de l'inscription: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Génération du token JWT avec la fonction utilitaire
    const token = generateToken(user._id);
    console.log(`✅ [Auth] Connexion réussie pour ${user.username} (${user._id})`);

    // Envoi de la réponse
    res.json({
      message: 'Connexion réussie',
      token,
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
    console.error(`📛 [Auth] Erreur lors de la connexion: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
  }
};

// Récupérer les informations de l'utilisateur actuel
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(`📛 [Auth] Erreur lors de la récupération de l'utilisateur: ${error.message}`, error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};