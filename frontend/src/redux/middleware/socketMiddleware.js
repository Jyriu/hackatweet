import { io } from 'socket.io-client';
import {
  setConnected,
  setSocketError,
  setOnlineUsers,
  removeOnlineUser
} from '../Store';
import {
  addNotification,
} from '../Store';
import {
  addMessage,
  markConversationAsRead,
} from '../Store';

const SOCKET_CONNECT = 'socket/connect';
const SOCKET_DISCONNECT = 'socket/disconnect';
const SEND_MESSAGE = 'socket/sendMessage';
const MARK_CONVERSATION_READ = 'socket/markConversationRead';
const GET_ONLINE_USERS = 'socket/getOnlineUsers';
const USER_TYPING = 'socket/userTyping';

// Actions créateurs pour le middleware
export const connectSocket = () => ({ type: SOCKET_CONNECT });
export const disconnectSocket = () => ({ type: SOCKET_DISCONNECT });
export const sendMessage = (conversationId, content) => ({
  type: SEND_MESSAGE,
  payload: { conversationId, content }
});
export const sendMarkConversationRead = (conversationId) => ({
  type: MARK_CONVERSATION_READ,
  payload: { conversationId }
});
export const getOnlineUsers = () => ({ type: GET_ONLINE_USERS });
export const sendUserTyping = (conversationId) => ({
  type: USER_TYPING,
  payload: { conversationId }
});

// Middleware Socket.io
const socketMiddleware = store => {
  let socket = null;

  return next => action => {
    const { type, payload } = action;
    const { dispatch, getState } = store;
    const token = localStorage.getItem('token');

    switch (type) {
      case SOCKET_CONNECT:
        if (socket) {
          socket.disconnect();
        }

        // Création d'une nouvelle connexion Socket.io
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
        socket = io(backendUrl, {
          auth: { token }
        });

        // Gestion des événements Socket.io
        socket.on('connect', () => {
          dispatch(setConnected(true));
          console.log('WebSocket connecté');
        });

        socket.on('connect_error', (error) => {
          dispatch(setSocketError(error.message));
          console.error('Erreur de connexion WebSocket:', error);
        });

        socket.on('disconnect', () => {
          dispatch(setConnected(false));
          console.log('WebSocket déconnecté');
        });

        // Écouter les nouvelles notifications
        socket.on('new_notification', (notification) => {
          dispatch(addNotification(notification));
        });

        // Écouter les nouveaux messages
        socket.on('new_message', (message) => {
          console.log('Nouveau message reçu:', message);
          const currentUser = getState().user?.currentUser?.id; // ID de l'utilisateur connecté
          
          // Déterminer si le message vient de l'utilisateur courant
          const isFromCurrentUser = message.sender._id === currentUser;
          
          // Utiliser l'ID de conversation inclus dans le message
          const conversationId = message.conversation;
          
          if (!conversationId) {
            console.error('Message reçu sans ID de conversation');
            return;
          }
          
          console.log(`Ajout du message à la conversation ${conversationId}, de l'utilisateur: ${isFromCurrentUser ? 'moi' : 'autre personne'}`);
          
          dispatch(addMessage({
            conversationId,
            message: {
              ...message,
              isFromCurrentUser
            }
          }));
        });

        // Message envoyé avec succès
        socket.on('message_sent', (message) => {
          console.log('Message envoyé avec succès:', message);
          
          // Utiliser l'ID de conversation inclus dans le message
          const conversationId = message.conversation;
          
          if (!conversationId) {
            console.error('Message envoyé sans ID de conversation');
            return;
          }
          
          dispatch(addMessage({
            conversationId,
            message: {
              ...message,
              isFromCurrentUser: true
            }
          }));
        });

        // Conversation marquée comme lue
        socket.on('conversation_read', (data) => {
          dispatch(markConversationAsRead({
            conversationId: data.conversationId,
            count: data.count
          }));
        });

        // L'autre utilisateur a lu les messages
        socket.on('other_user_read_messages', (data) => {
          dispatch(markConversationAsRead({
            conversationId: data.conversationId,
            userId: data.userId
          }));
        });

        // Erreur lors de l'envoi d'un message
        socket.on('message_error', (error) => {
          console.error('Erreur lors de l\'envoi du message:', error);
          // Ajouter ici la gestion d'erreur si nécessaire
        });

        // Utilisateurs en ligne
        socket.on('online_users', (data) => {
          dispatch(setOnlineUsers(data.users));
        });

        // Utilisateur déconnecté
        socket.on('user_offline', (data) => {
          dispatch(removeOnlineUser(data.userId));
        });

        // Utilisateur en train de taper
        socket.on('user_typing', (data) => {
          // Ajouter ici la gestion de l'événement "utilisateur en train de taper"
          console.log('Utilisateur en train de taper:', data);
        });

        break;

      case SOCKET_DISCONNECT:
        if (socket) {
          socket.disconnect();
          socket = null;
        }
        break;

      case SEND_MESSAGE:
        if (socket) {
          socket.emit('send_message', {
            conversationId: payload.conversationId,
            content: payload.content
          });
        }
        break;

      case MARK_CONVERSATION_READ:
        if (socket) {
          socket.emit('mark_conversation_read', {
            conversationId: payload.conversationId
          });
        }
        break;

      case GET_ONLINE_USERS:
        if (socket) {
          socket.emit('get_online_users');
        }
        break;

      case USER_TYPING:
        if (socket) {
          socket.emit('typing', {
            conversationId: payload.conversationId
          });
        }
        break;

      default:
        break;
    }

    return next(action);
  };
};

export default socketMiddleware; 