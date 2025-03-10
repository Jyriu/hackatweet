const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.model('User');

// Middleware d'authentification pour protéger les routes
exports.auth = async (req, res, next) => {
  try {
    // Vérifier la présence du token dans les headers
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé, token manquant' });
    }
    
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Ajouter les informations de l'utilisateur à la requête
    req.user = {
      id: user._id.toString(),
      username: user.username
    };
    
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};