import { io } from 'socket.io-client';
import {
  setConnected,
  setSocketError,
  setOnlineUsers,
  removeOnlineUser,
  addNotification,
  addMessage,
  markConversationAsRead,
  updateMessageStatus as updateMessageStatusReducer
} from '../Store';

// Actions Socket.io
export const SOCKET_ACTIONS = {
  CONNECT: 'socket/connect',
  DISCONNECT: 'socket/disconnect',
  SEND_MESSAGE: 'socket/sendMessage',
  MARK_AS_READ: 'socket/markAsRead',
  USER_TYPING: 'socket/userTyping',
  MESSAGE_STATUS: 'socket/messageStatus'
};

// Actions créateurs pour le middleware
export const emitSocketMessage = (conversationId, content, recipientId) => ({
  type: SOCKET_ACTIONS.SEND_MESSAGE,
  payload: { conversationId, content, recipientId }
});

export const markConversationAsReadAction = (conversationId) => ({
  type: SOCKET_ACTIONS.MARK_AS_READ,
  payload: { conversationId }
});

export const sendUserTyping = (conversationId, isTyping = true) => ({
  type: SOCKET_ACTIONS.USER_TYPING,
  payload: { conversationId, isTyping }
});

export const updateMessageStatusAction = (messageId, status) => ({
  type: SOCKET_ACTIONS.MESSAGE_STATUS,
  payload: { messageId, status }
});

// Import des actions nécessaires pour rafraîchir les conversations lors de la reconnexion
import { loadConversations } from '../actions/conversationActions';
import { loadConversationMessages } from '../actions/messageActions';

// Middleware Socket.io
const socketMiddleware = () => {
  let socket = null;
  let reconnectionAttempts = 0;
  const MAX_RECONNECTION_ATTEMPTS = 5;
  
  // Fonction pour normaliser l'utilisateur (peut être imbriqué ou direct)
  const normalizeUser = (userObj) => {
    if (!userObj) return null;
    
    // Si userObj a une propriété user, c'est une structure imbriquée
    if (userObj.user && typeof userObj.user === 'object') {
      console.log('📋 Structure utilisateur imbriquée détectée dans socketMiddleware, normalisation');
      return userObj.user;
    }
    
    // Sinon c'est déjà l'utilisateur direct
    return userObj;
  };

  // Vérifier que le middleware est bien une fonction qui renvoie une fonction
  return (store) => {
    // Vérifier que le store existe
    if (!store) {
      console.error("Store is undefined in socketMiddleware");
      return (next) => (action) => {
        return next(action);
      };
    }

    return (next) => (action) => {
      // Protection supplémentaire
      if (!action) {
        console.error("Action is undefined in socketMiddleware");
        return next ? next({type: '@@SOCKET_MIDDLEWARE/INIT'}) : undefined;
      }

      const { type, payload } = action;
      
      // Vérifier que le store et ses méthodes sont disponibles
      if (!store.dispatch || !store.getState) {
        console.error("Store methods are not available in socketMiddleware");
        return next(action);
      }
      
      const { dispatch, getState } = store;

      switch (type) {
        case SOCKET_ACTIONS.CONNECT:
          if (socket) {
            socket.disconnect();
          }

          reconnectionAttempts = 0;
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
          
          console.log('🔄 Tentative de connexion socket à:', backendUrl);
          console.log('🔑 Token utilisé:', getState().user.token);
          
          socket = io(backendUrl, {
            auth: { token: getState().user.token },
            reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000
          });
          
          // Exposer le socket globalement pour pouvoir l'utiliser dans les hooks et composants
          window.socket = socket;

          // Gestion de la connexion
          socket.on('connect', () => {
            const currentUser = normalizeUser(getState().user.currentUser);
            dispatch(setConnected(true));
            console.log('🟢 WebSocket connecté avec succès, ID:', socket.id);
            
            // Vérifier si nous avons un utilisateur
            if (!currentUser || !currentUser._id) {
              console.warn('⚠️ Pas d\'utilisateur connecté dans le Redux store lors de la connexion socket');
              
              // Essayer de récupérer le token
              const token = localStorage.getItem('token');
              if (!token) {
                console.error('❌ Pas de token dans localStorage, impossible de s\'identifier auprès du serveur socket');
                return;
              }
              
              // On ne peut pas récupérer l'utilisateur directement ici car c'est asynchrone
              // et ce gestionnaire d'événement est synchrone
              // On va simplement demander la liste des utilisateurs en ligne
              socket.emit('get_online_users');
              console.log('📤 Demande de la liste des utilisateurs en ligne envoyée sans identification');
              
              return;
            }
            
            console.log('👤 Utilisateur connecté:', currentUser._id);

            // Demander périodiquement la liste des utilisateurs en ligne
            const refreshOnlineUsers = () => {
              if (socket && socket.connected) {
                console.log('📊 Demande périodique de la liste des utilisateurs en ligne');
                socket.emit('get_online_users');
              }
            };
            
            // Demander immédiatement la liste
            refreshOnlineUsers();
            
            // Configurer un intervalle pour rafraîchir la liste périodiquement
            clearInterval(window.onlineUsersInterval);
            window.onlineUsersInterval = setInterval(refreshOnlineUsers, 10000); // Toutes les 10 secondes

            // S'identifier auprès du serveur avec une option explicite de broadcast
            socket.emit('user_connect', { 
              userId: currentUser._id, 
              username: currentUser.username,
              broadcast: true  // Option explicite pour demander un broadcast à tous
            });
            console.log('📤 Notification de connexion envoyée pour:', currentUser._id);

            // Envoyer un ping régulier pour maintenir le statut en ligne
            clearInterval(window.pingInterval);
            window.pingInterval = setInterval(() => {
              if (socket && socket.connected && currentUser && currentUser._id) {
                socket.emit('ping', { userId: currentUser._id });
              }
            }, 30000); // Toutes les 30 secondes

            // Lors d'une reconnexion, rafraîchir les données
            if (reconnectionAttempts > 0) {
              console.log('🔄 Reconnexion réussie, rafraîchissement des données...');
              dispatch(loadConversations());
              
              // Si une conversation est active, rafraîchir ses messages également
              const activeConversationId = getState().messages.activeConversation;
              if (activeConversationId) {
                dispatch(loadConversationMessages(activeConversationId));
              }
            }
            reconnectionAttempts = 0;
          });

          socket.on('connect_error', (error) => {
            dispatch(setSocketError(error.message));
            console.error('❌ Erreur de connexion WebSocket:', error);
            reconnectionAttempts++;
          });

          socket.on('disconnect', () => {
            dispatch(setConnected(false));
            console.log('🔴 WebSocket déconnecté');
          });

          socket.on('reconnect_attempt', (attempt) => {
            console.log(`🔄 Tentative de reconnexion (${attempt}/${MAX_RECONNECTION_ATTEMPTS})...`);
            reconnectionAttempts = attempt;
          });

          socket.on('reconnect_failed', () => {
            console.error('❌ Échec de la reconnexion après plusieurs tentatives');
            dispatch(setSocketError('Impossible de se reconnecter au serveur'));
          });

          socket.on('reconnect', () => {
            console.log('🔄 Socket.io reconnecté après', reconnectionAttempts, 'tentatives');
            
            // Réinitialiser le statut de connexion et les erreurs
            dispatch(setConnected(true));
            dispatch(setSocketError(null));
            
            // Notifier le serveur que l'utilisateur est de retour en ligne
            const currentUser = normalizeUser(getState().user.currentUser);
            if (currentUser && currentUser._id) {
              socket.emit('user_connect', { 
                userId: currentUser._id, 
                username: currentUser.username 
              });
              console.log('📤 Notification de reconnexion envoyée pour:', currentUser._id);
            }
            
            // Récupérer les données à jour
            dispatch(loadConversations());
            
            // Rafraîchir les messages de la conversation active si applicable
            const activeConversationId = getState().messages.activeConversation;
            if (activeConversationId) {
              dispatch(loadConversationMessages(activeConversationId));
            }
            
            // Réinitialiser le compteur de tentatives
            reconnectionAttempts = 0;
          });

          // Notifications générales (likes, follows, etc.)
          socket.on('new_notification', (notification) => {
            console.log('📬 Nouvelle notification reçue:', notification);
            dispatch(addNotification(notification));
          });

          // Gestion des utilisateurs en ligne
          socket.on('online_users', (users) => {
            console.log('👥 Liste des utilisateurs en ligne reçue:', users);
            if (Array.isArray(users)) {
              const currentUser = normalizeUser(getState().user.currentUser);
              
              // Convertir tous les IDs en chaînes de caractères pour une comparaison cohérente
              const normalizedUsers = users.map(userId => typeof userId === 'object' ? userId.userId.toString() : userId.toString());
              
              // Assurons-nous que l'utilisateur actuel est inclus dans la liste
              if (currentUser && currentUser._id) {
                const currentUserId = currentUser._id.toString();
                if (!normalizedUsers.includes(currentUserId)) {
                  normalizedUsers.push(currentUserId);
                  console.log('➕ Ajout de l\'utilisateur actuel à la liste des utilisateurs en ligne');
                }
              }
              
              console.log('👥 Liste normalisée des utilisateurs en ligne:', normalizedUsers);
              
              // Mettre à jour le store avec la liste normalisée
              dispatch(setOnlineUsers(normalizedUsers));
            } else {
              console.error('❌ Format invalide pour les utilisateurs en ligne:', users);
            }
          });

          socket.on('user_online', (data) => {
            // Peut être un ID d'utilisateur ou un objet { userId, username }
            const userId = typeof data === 'object' ? data.userId : data;
            
            if (!userId) {
              console.error('❌ Erreur: ID utilisateur manquant pour user_online');
              return;
            }
            
            console.log('👤 Utilisateur connecté:', userId);
            const currentOnlineUsers = getState().socket.onlineUsers || [];
            
            // Convertir l'ID de l'utilisateur en chaîne de caractères
            const normalizedUserId = userId.toString();
            
            // Vérifier si l'utilisateur est déjà dans la liste (après normalisation)
            const normalizedOnlineUsers = currentOnlineUsers.map(id => id.toString());
            
            if (!normalizedOnlineUsers.includes(normalizedUserId)) {
              // Ajouter à la liste en utilisant le format cohérent
              dispatch(setOnlineUsers([...currentOnlineUsers, normalizedUserId]));
              console.log(`✅ Utilisateur ${normalizedUserId} ajouté à la liste des utilisateurs en ligne`);
            }
          });

          socket.on('user_offline', (userId) => {
            if (!userId) {
              console.error('❌ Erreur: ID utilisateur manquant pour user_offline');
              return;
            }
            
            console.log('👤 Utilisateur déconnecté:', userId);
            const currentOnlineUsers = getState().socket.onlineUsers || [];
            
            // Convertir l'ID de l'utilisateur en chaîne de caractères
            const normalizedUserId = userId.toString();
            
            // Filtrer la liste en utilisant l'ID normalisé
            const updatedOnlineUsers = currentOnlineUsers.filter(id => 
              id.toString() !== normalizedUserId
            );
            
            dispatch(setOnlineUsers(updatedOnlineUsers));
            console.log(`✅ Utilisateur ${normalizedUserId} retiré de la liste des utilisateurs en ligne`);
          });

          // Événements liés aux messages
          socket.on('message_status_update', ({ messageId, status, conversationId }) => {
            if (!messageId || !status) {
              console.error('❌ Données incomplètes pour mise à jour de statut de message:', { messageId, status });
              return;
            }
            console.log('📝 Mise à jour du statut du message:', { messageId, status, conversationId });
            dispatch(updateMessageStatusReducer({ messageId, status, conversationId }));
          });

          socket.on('user_typing', ({ conversationId, userId }) => {
            // Gérer l'indication de frappe
            console.log('✍️ Utilisateur en train d\'écrire:', { conversationId, userId });
          });

          // Gestion des messages reçus
          socket.on('new_message', (message) => {
            console.log('📨 Nouveau message reçu:', message);

            if (!message) {
              console.error('❌ Message reçu invalide:', message);
              return;
            }
            
            // Vérifier si le message a un ID de conversation
            const conversationId = message.conversationId || message.conversation;
            
            if (!conversationId) {
              console.error('❌ Message sans ID de conversation:', message);
              return;
            }
            
            // Vérifier que l'utilisateur est connecté
            const currentUser = normalizeUser(getState().user.currentUser);
            if (!currentUser || !currentUser._id) {
              console.error('❌ Utilisateur non connecté lors de la réception du message');
              return;
            }
            
            // Vérifier si la conversation existe dans le store
            const conversations = getState().messages.conversations || {};
            const conversation = conversations[conversationId];
            
            if (!conversation) {
              console.error('❌ Conversation non trouvée dans le store:', conversationId);
              // Charger les conversations car celle-ci n'existe pas encore
              dispatch(loadConversations());
              return;
            }
            
            // Vérifier si le message existe déjà dans la conversation
            const conversationMessages = conversation.messages || [];
            
            // Si le message a un ID et existe déjà, ne pas l'ajouter à nouveau
            if (message._id && conversationMessages.some(m => m._id === message._id)) {
              console.log('📩 Message déjà présent dans la conversation, ignoré:', message._id);
              return;
            }
            
            // Préparer le message pour l'ajout au store
            const messageToAdd = {
              ...message,
              conversation: conversationId, // Normalisation
              isFromCurrentUser: message.sender === currentUser._id,
              status: message.status || (message.sender === currentUser._id ? 'sent' : 'received'),
              createdAt: message.createdAt || new Date().toISOString()
            };
            
            // Ajouter le message à la conversation
            dispatch(addMessage({
              conversationId: conversationId,
              message: messageToAdd
            }));
            
            // Si le message n'est pas de l'utilisateur actuel, créer une notification et envoyer un accusé de réception
            if (message.sender !== currentUser._id) {
              // Notification pour les nouveaux messages
              dispatch(addNotification({
                _id: `msg-notif-${Date.now()}`,
                type: 'message',
                sender: message.sender,
                content: `Nouveau message: ${message.content.substring(0, 20)}${message.content.length > 20 ? '...' : ''}`,
                read: false,
                createdAt: new Date().toISOString()
              }));
              
              // Marquer le message comme "reçu" (delivered)
              if (message._id) {
                // Utiliser le nouvel événement 'message_status' au lieu de 'message_status_update'
                socket.emit('message_status', {
                  messageId: message._id,
                  status: 'delivered'
                });
                console.log('📤 Accusé de réception envoyé pour:', message._id);
              }
              
              // Rafraîchir la conversation active si c'est celle concernée par le message
              const activeConversationId = getState().messages.activeConversation;
              if (activeConversationId === conversationId) {
                // Marquer automatiquement comme lu si la conversation est active
                setTimeout(() => {
                  socket.emit('mark_conversation_read', { conversationId });
                  console.log('📖 Marquage automatique comme lu pour la conversation active:', conversationId);
                }, 1000);
              }
            }
          });

          break;

        case SOCKET_ACTIONS.DISCONNECT:
          if (socket) {
            // Nettoyer tous les intervalles
            clearInterval(window.pingInterval);
            clearInterval(window.onlineUsersInterval);
            
            // Notifier le serveur de la déconnexion
            const currentUser = normalizeUser(getState().user.currentUser);
            if (currentUser && currentUser._id) {
              try {
                // Essayer plusieurs formats pour maximiser la compatibilité
                socket.emit('user_disconnect', { userId: currentUser._id });
                socket.emit('disconnect_user', { userId: currentUser._id });
                console.log('📤 Notifications de déconnexion envoyées pour:', currentUser._id);
              } catch (error) {
                console.error('❌ Erreur lors de l\'envoi des notifications de déconnexion:', error);
              }
            } else {
              console.log('⚠️ Impossible d\'envoyer la notification de déconnexion: utilisateur non connecté');
            }
            
            // Déconnecter le socket
            try {
              socket.disconnect();
              console.log('🔴 Socket déconnecté manuellement');
            } catch (error) {
              console.error('❌ Erreur lors de la déconnexion du socket:', error);
            }
            
            // Réinitialiser la référence au socket
            socket = null;
            window.socket = null;
          }
          break;

        case SOCKET_ACTIONS.SEND_MESSAGE:
          if (socket) {
            // Ajouter l'ID de l'utilisateur actuel au payload pour identifier l'expéditeur
            const currentUser = normalizeUser(getState().user.currentUser);
            
            if (!currentUser || !currentUser._id) {
              console.error('❌ Impossible d\'envoyer le message: utilisateur non connecté');
              return next(action);
            }
            
            if (!payload || !payload.conversationId || !payload.content) {
              console.error('❌ Données de message invalides:', payload);
              return next(action);
            }
            
            const { conversationId, content, recipientId } = payload;
            
            // Construire le message selon le format attendu par le serveur
            // Adapter ceci selon la documentation ou l'implémentation du serveur
            const messagePayload = {
              conversationId, // ID de la conversation
              content,        // Contenu du message
              sender: currentUser._id,  // ID de l'expéditeur
              recipient: recipientId,   // ID du destinataire
              timestamp: new Date().toISOString() // Horodatage
            };
            
            console.log('📤 Émission du message via socket:', messagePayload);
            
            // Émettre l'événement socket selon le format attendu par le serveur
            // Essayer plusieurs formats pour maximiser la compatibilité
            
            // Format 1: événement 'message' avec tout le payload
            socket.emit('message', messagePayload);
            
            // Format 2: événement 'send_message' avec tout le payload
            socket.emit('send_message', messagePayload);
            
            // Format 3: si le serveur attend un événement spécifique pour les messages de conversation
            socket.emit('conversation_message', messagePayload);
            
            console.log('📤 Message envoyé via plusieurs canaux pour compatibilité');
          } else {
            console.error('❌ Socket non connecté lors de l\'envoi du message');
          }
          break;

        case SOCKET_ACTIONS.MARK_AS_READ:
          if (socket) {
            const { conversationId } = payload;
            
            if (!conversationId) {
              console.error('❌ ID de conversation manquant pour le marquage comme lu');
              return next(action);
            }
            
            console.log('📖 Marquage de la conversation comme lue:', conversationId);
            socket.emit('mark_conversation_read', { conversationId });
          }
          break;

        case SOCKET_ACTIONS.USER_TYPING:
          if (socket) {
            const { conversationId, isTyping } = payload;
            
            if (!conversationId) {
              console.error('❌ ID de conversation manquant pour l\'indication de saisie');
              return next(action);
            }
            
            console.log(`✍️ Indication de saisie: ${isTyping ? 'en cours' : 'terminée'} dans la conversation`, conversationId);
            socket.emit('typing', { conversationId, isTyping });
          }
          break;

        case SOCKET_ACTIONS.MESSAGE_STATUS:
          if (socket) {
            const { messageId, status } = payload;
            
            if (!messageId || !status) {
              console.error('❌ Données incomplètes pour la mise à jour du statut du message:', payload);
              return next(action);
            }
            
            console.log('📝 Mise à jour du statut du message:', { messageId, status });
            socket.emit('message_status', { messageId, status });
          }
          break;
      }

      return next(action);
    };
  };
};

export default socketMiddleware; 