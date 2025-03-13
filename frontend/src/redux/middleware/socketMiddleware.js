import { io } from 'socket.io-client';
import {
  setConnected,
  setSocketError,
  setOnlineUsers,
  removeOnlineUser,
  addNotification,
  addMessage,
  markConversationAsRead
} from '../Store';

// Actions Socket.io
export const SOCKET_ACTIONS = {
  CONNECT: 'socket/connect',
  DISCONNECT: 'socket/disconnect',
  SEND_MESSAGE: 'socket/sendMessage',
  MARK_AS_READ: 'socket/markAsRead',
  USER_TYPING: 'socket/userTyping'
};

// Actions créateurs pour le middleware
export const emitSocketMessage = (conversationId, content) => ({
  type: SOCKET_ACTIONS.SEND_MESSAGE,
  payload: { conversationId, content }
});

export const sendMarkConversationRead = (messageId) => ({
  type: SOCKET_ACTIONS.MARK_AS_READ,
  payload: { messageId }
});

export const sendUserTyping = (conversationId) => ({
  type: SOCKET_ACTIONS.USER_TYPING,
  payload: { conversationId }
});

// Middleware Socket.io
const socketMiddleware = () => {
  let socket = null;

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

          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
          socket = io(backendUrl, {
            auth: { token: getState().user.token }
          });

          // Gestion de la connexion
          socket.on('connect', () => {
            dispatch(setConnected(true));
            console.log('🟢 WebSocket connecté');
          });

          socket.on('connect_error', (error) => {
            dispatch(setSocketError(error.message));
            console.error('❌ Erreur de connexion WebSocket:', error);
          });

          socket.on('disconnect', () => {
            dispatch(setConnected(false));
            console.log('🔴 WebSocket déconnecté');
          });

          // Notifications générales (likes, follows, etc.)
          socket.on('new_notification', (notification) => {
            console.log('📬 Nouvelle notification reçue:', notification);
            dispatch(addNotification(notification));
          });

          // Gestion des utilisateurs en ligne
          socket.on('user_online', (userId) => {
            dispatch(setOnlineUsers([...getState().socket.onlineUsers, userId]));
          });

          socket.on('user_offline', (userId) => {
            dispatch(removeOnlineUser(userId));
          });

          // Événements liés aux messages
          socket.on('message_status_update', ({ messageId, status, conversationId }) => {
            console.log('📝 Mise à jour du statut du message:', { messageId, status });
            // Utiliser l'action mise à jour du statut du message
          });

          socket.on('user_typing', ({ conversationId, userId }) => {
            // Gérer l'indication de frappe (à implémenter selon vos besoins)
            console.log('✍️ Utilisateur en train d\'écrire:', { conversationId, userId });
          });

          // Réception d'un nouveau message en temps réel
          socket.on('new_message', (message) => {
            console.log('📨 Nouveau message reçu:', message);
            const currentUser = getState().user.currentUser;
            
            dispatch(addMessage({
              conversationId: message.conversation,
              message: {
                ...message,
                isFromCurrentUser: message.sender._id === currentUser._id,
                status: 'delivered'
              }
            }));
          });

          break;

        case SOCKET_ACTIONS.DISCONNECT:
          if (socket) {
            socket.disconnect();
            socket = null;
          }
          break;

        case SOCKET_ACTIONS.SEND_MESSAGE:
          if (socket) {
            socket.emit('send_message', payload);
          }
          break;

        case SOCKET_ACTIONS.MARK_AS_READ:
          if (socket) {
            socket.emit('mark_as_read', payload);
          }
          break;

        case SOCKET_ACTIONS.USER_TYPING:
          if (socket) {
            socket.emit('user_typing', payload);
          }
          break;
      }

      return next(action);
    };
  };
};

export default socketMiddleware; 