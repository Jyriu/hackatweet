const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.model('User');

// Middleware d'authentification pour protéger les routes
exports.auth = async (req, res, next) => {
  try {
    // Vérifier la présence du token dans les headers
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.warn(`⚠️ [Auth] Tentative d'accès sans token: ${req.originalUrl}`);
      return res.status(401).json({ message: 'Authentification requise' });
    }
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.warn(`⚠️ [Auth] Token valide mais utilisateur introuvable: ${decoded.id}`);
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Ajouter les informations utilisateur à l'objet request
    req.user = user;
    req.token = token;
    console.log(`ℹ️ [Auth] Accès autorisé à ${req.originalUrl} pour l'utilisateur ${user.username} (${user._id})`);
    next();
  } catch (error) {
    console.error(`📛 [Auth] Erreur d'authentification: ${error.message}`);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};