require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { faker } = require('@faker-js/faker');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');

// Importer tous les modèles (nécessaire pour que MongoDB crée les collections)
require('./models/User');
require('./models/Tweet');
require('./models/Replies');
require('./models/Notification');
require('./models/Emotion');
require('./models/Message');
require('./models/Conversation');
const User = mongoose.model('User');
const Notification = mongoose.model('Notification');
const Message = mongoose.model('Message');
const Conversation = mongoose.model('Conversation');


const app = express();
const PORT = process.env.PORT || 5001;


// Middleware de base
app.use(cors());
app.use(express.json());

// Exposer le dossier uploads pour servir les images

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Importer les routes
const userRoutes = require("./routes/userRoutes");
const tweetRoutes = require("./routes/tweetRoutes");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const searchRoutes = require("./routes/searchRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const emotionRoutes = require("./routes/emotionRoutes");
const conversationRoutes = require("./routes/conversationRoutes");

// Application des routes
app.use('/api/user', userRoutes);
app.use('/api/tweet', tweetRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/conversations', conversationRoutes);

const createTweets = async () => {
  try {
    const Tweet = mongoose.model('Tweet');
    const tweets = [];
    const authorId = '67d00c5e00073dd855bac0a5';

    for (let i = 0; i < 5; i++) {
      const tweet = new Tweet({
        text: faker.lorem.sentence(),
        author: authorId,
        hashtags: [faker.lorem.word(), faker.lorem.word()],
        date: faker.date.past(),
      });

      tweets.push(tweet);
    }

    await Tweet.insertMany(tweets);
    console.log('100 tweets created successfully');
  } catch (error) {
    console.error('Error creating tweets:', error);
  } 
};

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
  
  // SYSTÈME DE MESSAGERIE
  // Envoi d'un message à un utilisateur
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content } = data;
      
      if (!conversationId || !content) {
        return socket.emit('message_error', { error: 'Données manquantes' });
      }
      
      console.log(`Tentative d'envoi de message: conversation=${conversationId}, content=${content}`);
      
      // Trouver la conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.user._id
      });
      
      if (!conversation) {
        return socket.emit('message_error', { error: 'Conversation non trouvée ou accès refusé' });
      }
      
      // Trouver l'autre participant
      const recipientId = conversation.participants.find(
        p => p.toString() !== socket.user._id.toString()
      );
      
      if (!recipientId) {
        return socket.emit('message_error', { error: 'Destinataire non trouvé' });
      }
      
      // Créer et sauvegarder le message
      const newMessage = new Message({
        conversation: conversationId,
        sender: socket.user._id,
        recipient: recipientId,
        content,
        read: false,
        createdAt: new Date()
      });
      
      await newMessage.save();
      
      // Mettre à jour le dernier message et la date de mise à jour de la conversation
      // Et incrémenter le compteur de messages non lus pour le destinataire
      const unreadCount = conversation.unreadCount || new Map();
      const recipientUnread = unreadCount.get(recipientId.toString()) || 0;
      unreadCount.set(recipientId.toString(), recipientUnread + 1);
      
      await Conversation.updateOne(
        { _id: conversationId },
        { 
          lastMessage: newMessage._id,
          updatedAt: new Date(),
          unreadCount
        }
      );
      
      // Récupérer les détails de l'expéditeur pour la réponse
      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', '_id username photo')
        .populate('recipient', '_id username photo');
      
      // Enrichir les données du message pour le frontend
      const enrichedMessage = {
        ...populatedMessage.toObject(),
        conversation: conversationId
      };
      
      console.log(`Message créé et enrichi:`, JSON.stringify(enrichedMessage, null, 2));
      
      // Envoyer le message à l'expéditeur pour confirmation
      socket.emit('message_sent', enrichedMessage);
      
      // Envoyer le message au destinataire s'il est connecté
      const recipientSocketId = userSocketMap[recipientId.toString()];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('new_message', enrichedMessage);
      }
      
      console.log(`📨 [Message] De ${socket.user.username} à ${recipientId} dans la conversation ${conversationId}`);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      socket.emit('message_error', { error: error.message });
    }
  });
  
  // Marquer les messages d'une conversation comme lus
  socket.on('mark_conversation_read', async (data) => {
    try {
      const { conversationId } = data;
      
      if (!conversationId) {
        return socket.emit('message_error', { error: 'ID de conversation manquant' });
      }
      
      // Vérifier si la conversation existe et si l'utilisateur y participe
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.user._id
      });
      
      if (!conversation) {
        return socket.emit('message_error', { error: 'Conversation non trouvée ou accès refusé' });
      }
      
      // Marquer tous les messages non lus adressés à l'utilisateur comme lus
      const result = await Message.updateMany(
        {
          conversation: conversationId,
          recipient: socket.user._id,
          read: false
        },
        { read: true }
      );
      
      // Mettre à jour le compteur de messages non lus dans la conversation
      const unreadCount = conversation.unreadCount || new Map();
      unreadCount.set(socket.user._id.toString(), 0);
      
      await Conversation.updateOne(
        { _id: conversationId },
        { unreadCount }
      );
      
      // Notifier le client que les messages ont été marqués comme lus
      socket.emit('conversation_read', { 
        conversationId,
        count: result.modifiedCount
      });
      
      // Notifier l'autre participant si nécessaire
      const otherParticipant = conversation.participants.find(
        p => p.toString() !== socket.user._id.toString()
      );
      
      if (otherParticipant) {
        const otherParticipantSocketId = userSocketMap[otherParticipant.toString()];
        if (otherParticipantSocketId) {
          io.to(otherParticipantSocketId).emit('other_user_read_messages', {
            conversationId,
            userId: socket.user._id
          });
        }
      }
      
      console.log(`📖 [Messages] ${result.modifiedCount} messages marqués comme lus par ${socket.user.username} dans la conversation ${conversationId}`);
    } catch (error) {
      console.error('Erreur marquer conversation comme lue:', error);
      socket.emit('message_error', { error: error.message });
    }
  });
  
  // Récupérer la liste des utilisateurs en ligne
  socket.on('get_online_users', () => {
    // Convertir l'objet de mapping en tableau d'IDs d'utilisateurs
    const onlineUserIds = Object.keys(userSocketMap);
    socket.emit('online_users', { users: onlineUserIds });
  });
  
  // Gérer la déconnexion
  socket.on('disconnect', () => {
    console.log(`🔌 [Socket] Utilisateur déconnecté: ${socket.user.username} (${socket.user._id})`);
    delete userSocketMap[socket.user._id];
    
    // Informer les autres utilisateurs qu'un utilisateur s'est déconnecté
    socket.broadcast.emit('user_offline', { userId: socket.user._id });
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
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connecté à MongoDB');
    //createTweets()
    // Démarrage du serveur après connexion réussie
    server.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erreur de connexion à MongoDB:", err);
    process.exit(1);
  });

// Gestion des événements de connexion
mongoose.connection.on("connected", () => {
  console.log("Mongoose connecté à la base de données");
});

mongoose.connection.on("error", (err) => {
  console.error(`Erreur de connexion Mongoose: ${err}`);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose déconnecté de la base de données");
});

// Gestion propre de la déconnexion
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("Connexion MongoDB fermée");
  process.exit(0);
});

// Ajouter ceci après l'initialisation de io
io.engine.on("connection_error", (err) => {
  console.error(`📛 [Socket] Erreur de connexion: ${err.message}`, err);
});