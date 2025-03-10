require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importer tous les modèles (nécessaire pour que MongoDB crée les collections)
require('./models/User');
require('./models/Tweet');
require('./models/Replies');
require('./models/Notification');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware de base
app.use(cors());
app.use(express.json());

// Route de test simple
// Route pour créer un utilisateur test (temporaire)
app.get('/api/test', async (req, res) => {
  try {
    const User = mongoose.model('User');

    // Vérifier si l'utilisateur test existe déjà
    const existingUser = await User.findOne({ email: 'test@test.com' });

    if (existingUser) {
      return res.json({ message: 'Utilisateur test existe déjà', user: existingUser });
    }

    // Créer un nouvel utilisateur test
    const newUser = new User({
      email: 'test@test.com',
      password: 'password123',
      nom: 'Test',
      prenom: 'User',
      username: 'testuser',
      bio: 'Ceci est un utilisateur test'
    });

    await newUser.save();

    res.json({ message: 'Utilisateur test créé avec succès', user: newUser });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Importation des routes
const authRoutes = require('./routes/authRoutes');
const tweetRoutes = require('./routes/tweetRoutes');
const userRoutes = require('./routes/userRoutes');

// Application des routes
app.use('/api/auth', authRoutes);
app.use('/api/tweet', tweetRoutes);
app.use('/api/users', userRoutes);

// Connexion à MongoDB puis démarrage du serveur
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connecté à MongoDB');

    // Démarrage du serveur après connexion réussie
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  });

// Gestion des événements de connexion
mongoose.connection.on('connected', () => {
  console.log('Mongoose connecté à la base de données');
});

mongoose.connection.on('error', (err) => {
  console.error(`Erreur de connexion Mongoose: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose déconnecté de la base de données');
});

// Gestion propre de la déconnexion
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Connexion MongoDB fermée');
  process.exit(0);
});