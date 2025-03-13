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
  
  // Informer tous les clients de l'utilisateur connecté
  io.emit('user_online', { 
    userId: socket.user._id, 
    username: socket.user.username 
  });
  
  // Envoyer la liste des utilisateurs en ligne
  const onlineUsers = Object.keys(userSocketMap);
  socket.emit('online_users', { users: onlineUsers });
  
  // Envoyer les notifications non lues au moment de la connexion
  socket.emit('connection_established', { 
    message: 'Connected to notification service',
    userId: socket.user._id 
  });
  
  // Ping régulier pour maintenir la connexion active
  const pingInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('ping', { timestamp: new Date() });
    } else {
      clearInterval(pingInterval);
    }
  }, 30000); // 30 secondes
  
  // SYSTÈME DE MESSAGERIE
  // Envoi d'un message à un utilisateur
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content } = data;
      
      if (!conversationId || !content) {
        return socket.emit('message_error', { error: 'Données manquantes' });
      }
      
      console.log(`Tentative d'envoi de message: conversation=${conversationId}, content=${content.substring(0, 30)}...`);
      
      // Trouver la conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.user._id,
        isActive: true
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
      
      // Créer et sauvegarder le message avec les nouveaux champs
      const newMessage = new Message({
        conversation: conversationId,
        sender: socket.user._id,
        recipient: recipientId,
        content,
        status: 'sent',
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
        conversation: conversationId,
        isFromCurrentUser: true // Pour l'expéditeur
      };
      
      // Envoyer le message à l'expéditeur pour confirmation
      socket.emit('message_sent', enrichedMessage);
      
      // Vérifier si le destinataire est en ligne
      const recipientSocketId = userSocketMap[recipientId.toString()];
      const isRecipientOnline = !!recipientSocketId;
      
      // Si le destinataire est en ligne, envoyer le message et mettre à jour le statut
      if (isRecipientOnline) {
        // Envoyer au destinataire avec isFromCurrentUser = false
        const messageForRecipient = {
          ...enrichedMessage,
          isFromCurrentUser: false
        };
        
        io.to(recipientSocketId).emit('new_message', messageForRecipient);
        
        // Mettre à jour le statut du message comme "delivered"
        await Message.findByIdAndUpdate(newMessage._id, { 
          status: 'delivered',
          deliveredAt: new Date()
        });
        
        // Informer l'expéditeur du changement de statut
        socket.emit('message_status_update', {
          messageId: newMessage._id,
          status: 'delivered',
          deliveredAt: new Date()
        });
      }
      
      console.log(`📨 [Message] De ${socket.user.username} à ${recipientId} dans la conversation ${conversationId} (destinataire ${isRecipientOnline ? 'en ligne' : 'hors ligne'})`);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      socket.emit('message_error', { error: error.message });
    }
  });
  
  // Mise à jour du statut d'un message (lu, etc.)
  socket.on('message_status', async (data) => {
    try {
      const { messageId, status } = data;
      
      if (!messageId || !status) {
        return socket.emit('message_error', { error: 'ID de message et statut requis' });
      }
      
      // Vérifier si le message existe et si l'utilisateur est le destinataire
      const message = await Message.findOne({
        _id: messageId,
        recipient: socket.user._id
      });
      
      if (!message) {
        return socket.emit('message_error', { error: 'Message non trouvé ou accès refusé' });
      }
      
      // Mettre à jour le statut du message
      const updates = { status };
      
      if (status === 'delivered') {
        updates.deliveredAt = new Date();
      } else if (status === 'read') {
        updates.read = true;
        updates.readBy = message.readBy || [];
        
        // Ajouter l'utilisateur à la liste readBy s'il n'y est pas déjà
        const alreadyRead = updates.readBy.some(entry => 
          entry.user && entry.user.toString() === socket.user._id.toString()
        );
        
        if (!alreadyRead) {
          updates.readBy.push({
            user: socket.user._id,
            readAt: new Date()
          });
        }
      }
      
      await Message.findByIdAndUpdate(messageId, updates);
      
      // Notifier l'expéditeur du changement de statut
      const senderSocketId = userSocketMap[message.sender.toString()];
      if (senderSocketId) {
        io.to(senderSocketId).emit('message_status_update', {
          messageId,
          status,
          ...updates
        });
      }
      
      socket.emit('status_updated', { messageId, status });
      
      console.log(`📝 [Message] Statut mis à jour: ${messageId} => ${status}`);
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
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
        participants: socket.user._id,
        isActive: true
      });
      
      if (!conversation) {
        return socket.emit('message_error', { error: 'Conversation non trouvée ou accès refusé' });
      }
      
      // Trouver tous les messages non lus adressés à l'utilisateur
      const unreadMessages = await Message.find({
        conversation: conversationId,
        recipient: socket.user._id,
        read: false
      });
      
      // Pour chaque message, mettre à jour les champs read, status et readBy
      let updatedCount = 0;
      for (const message of unreadMessages) {
        message.read = true;
        message.status = 'read';
        
        // Ajouter l'utilisateur à la liste readBy s'il n'y est pas déjà
        const alreadyRead = message.readBy.some(entry => 
          entry.user && entry.user.toString() === socket.user._id.toString()
        );
        
        if (!alreadyRead) {
          message.readBy.push({
            user: socket.user._id,
            readAt: new Date()
          });
        }
        
        await message.save();
        updatedCount++;
        
        // Notifier l'expéditeur que son message a été lu
        const senderSocketId = userSocketMap[message.sender.toString()];
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_status_update', {
            messageId: message._id,
            status: 'read',
            readBy: message.readBy
          });
        }
      }
      
      // Mettre à jour le compteur de messages non lus dans la conversation
      const unreadCount = conversation.unreadCount || new Map();
      unreadCount.set(socket.user._id.toString(), 0);
      
      await Conversation.updateOne(
        { _id: conversationId },
        { unreadCount }
      );
      
      socket.emit('conversation_read', { 
        conversationId, 
        count: updatedCount 
      });
      
      console.log(`✓ [Conversation] ${updatedCount} messages marqués comme lus dans ${conversationId}`);
    } catch (error) {
      console.error('Erreur marquage messages lus:', error);
      socket.emit('message_error', { error: error.message });
    }
  });
  
  // Indication de saisie en cours
  socket.on('typing', (data) => {
    const { conversationId, isTyping } = data;
    
    if (!conversationId) return;
    
    // Trouver les autres participants de la conversation
    Conversation.findById(conversationId)
      .then(conversation => {
        if (!conversation) return;
        
        // Envoyer l'indication de saisie aux autres participants en ligne
        conversation.participants.forEach(participantId => {
          if (participantId.toString() !== socket.user._id.toString()) {
            const recipientSocketId = userSocketMap[participantId.toString()];
            if (recipientSocketId) {
              io.to(recipientSocketId).emit('user_typing', {
                conversationId,
                userId: socket.user._id,
                username: socket.user.username,
                isTyping
              });
            }
          }
        });
      })
      .catch(err => console.error('Erreur lors de la notification de saisie:', err));
  });
  
  // Gestion de la déconnexion
  socket.on('disconnect', () => {
    // Supprimer l'utilisateur de la map des connexions
    if (socket.user && socket.user._id) {
      delete userSocketMap[socket.user._id];
      
      // Informer les autres utilisateurs
      io.emit('user_offline', { 
        userId: socket.user._id, 
        username: socket.user.username 
      });
      
      console.log(`🔌 [Socket] Utilisateur déconnecté: ${socket.user.username} (${socket.user._id})`);
    }
    
    // Nettoyer les intervalles
    clearInterval(pingInterval);
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