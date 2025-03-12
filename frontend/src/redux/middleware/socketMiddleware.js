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
  markMessageAsRead,
} from '../Store';

const SOCKET_CONNECT = 'socket/connect';
const SOCKET_DISCONNECT = 'socket/disconnect';
const SEND_MESSAGE = 'socket/sendMessage';
const MARK_MESSAGE_READ = 'socket/markMessageRead';
const GET_ONLINE_USERS = 'socket/getOnlineUsers';
const USER_TYPING = 'socket/userTyping';

// Actions créateurs pour le middleware
export const connectSocket = () => ({ type: SOCKET_CONNECT });
export const disconnectSocket = () => ({ type: SOCKET_DISCONNECT });
export const sendMessage = (conversationId, content, recipientId) => ({
  type: SEND_MESSAGE,
  payload: { conversationId, content, recipientId }
});
export const sendMarkMessageRead = (messageId) => ({
  type: MARK_MESSAGE_READ,
  payload: { messageId }
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
          const currentUser = getState().user?.currentUser?._id; // Utiliser currentUser._id au lieu de user.id
          const isFromCurrentUser = message.sender === currentUser;
          
          dispatch(addMessage({
            conversationId: message.conversation,
            message: {
              ...message,
              isFromCurrentUser
            }
          }));
        });

        // Message envoyé avec succès
        socket.on('message_sent', (message) => {
          dispatch(addMessage({
            conversationId: message.conversation,
            message: {
              ...message,
              isFromCurrentUser: true
            }
          }));
        });

        // Message marqué comme lu
        socket.on('message_read', (data) => {
          dispatch(markMessageAsRead({
            conversationId: data.conversationId,
            messageId: data.messageId,
            userId: data.readBy
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
            recipientId: payload.recipientId,
            content: payload.content
          });
        }
        break;

      case MARK_MESSAGE_READ:
        if (socket) {
          socket.emit('mark_message_read', {
            messageId: payload.messageId
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