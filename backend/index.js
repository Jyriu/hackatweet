require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Importer tous les modèles (nécessaire pour que MongoDB crée les collections)
require('./models/User');
require('./models/Tweet');
require('./models/Replies');
require('./models/Notification');
const User = mongoose.model('User');
const Notification = mongoose.model('Notification');

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
const searchRoutes = require('./routes/searchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Application des routes
app.use('/api/auth', authRoutes);
app.use('/api/tweet', tweetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

// Créer le serveur HTTP
const server = http.createServer(app);

// Initialiser Socket.io
const io = socketIo(server, {
  cors: {
    // Accepter toutes les origines pendant le développement
    origin: process.env.NODE_ENV === "production" 
      ? process.env.FRONTEND_URL || "http://localhost:3000"
      : "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Stocker les connexions des utilisateurs
const userSocketMap = {};

console.log('Configuration du middleware Socket.io...');
// Middleware Socket.io pour authentifier les utilisateurs
io.use(async (socket, next) => {
  try {
    // Chercher le token dans plusieurs endroits possibles
    const token = 
      socket.handshake.auth?.token ||               // Option 1: auth object (méthode standard)
      socket.handshake.headers?.token ||            // Option 2: header HTTP 
      socket.handshake.query?.token ||             // Option 3: query parameter
      socket.handshake.headers?.authorization?.replace('Bearer ', '') || // Option 5: header dans handshake
      socket.request?.headers?.authorization?.replace('Bearer ', ''); // Option 4: header Authorization standard
    
    if (!token) {
      console.log('🚫 Tentative de connexion sans token rejetée');
      return next(new Error('Authentication error: Token missing'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id username');
    
    if (!user) {
      console.log(`🚫 Utilisateur non trouvé: ${decoded.id}`);
      return next(new Error('Authentication error: User not found'));
    }
    
    // Attacher les informations utilisateur au socket
    socket.user = user;
    console.log(`✅ Utilisateur authentifié via socket: ${user.username}`);
    next();
  } catch (error) {
    console.log(`🚫 Erreur d'authentification socket: ${error.message}`);
    return next(new Error('Authentication error: ' + error.message));
  }
});
console.log('Middleware Socket.io configuré');

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log(`🔌 [Socket] Utilisateur connecté: ${socket.user.username} (${socket.user._id})`);
  
  // Stocker la connexion de l'utilisateur
  userSocketMap[socket.user._id] = socket.id;
  
  // Envoyer les notifications non lues au moment de la connexion
  socket.emit('connection_established', { message: 'Connected to notification service' });
  
  // Gérer la déconnexion
  socket.on('disconnect', () => {
    console.log(`🔌 [Socket] Utilisateur déconnecté: ${socket.user.username} (${socket.user._id})`);
    delete userSocketMap[socket.user._id];
  });
});

// Fonction pour envoyer une notification en temps réel
const sendNotification = async (notification) => {
  try {
    // Sauvegarder la notification dans la base de données
    const newNotification = new Notification(notification);
    await newNotification.save();
    
    // Si l'utilisateur est connecté, envoyer la notification en temps réel
    const socketId = userSocketMap[notification.userId.toString()];
    if (socketId) {
      console.log(`📨 [Notification] Envoi à l'utilisateur ${notification.userId}, type: ${notification.type}`);
      io.to(socketId).emit('new_notification', newNotification);
    } else {
      console.log(`📝 [Notification] Stockée pour l'utilisateur ${notification.userId} (hors ligne)`);
    }
    
    return newNotification;
  } catch (error) {
    console.error(`📛 [Notification] Erreur lors de l'envoi: ${error.message}`, error);
    throw error;
  }
};

// Rendre la fonction sendNotification disponible globalement
global.sendNotification = sendNotification;

// Connexion à MongoDB puis démarrage du serveur
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connecté à MongoDB');

    // Démarrage du serveur après connexion réussie
    server.listen(PORT, () => {
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

// Ajouter ceci après l'initialisation de io
io.engine.on("connection_error", (err) => {
  console.error(`📛 [Socket] Erreur de connexion: ${err.message}`, err);
});