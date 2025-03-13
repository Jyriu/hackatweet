import { SOCKET_ACTIONS } from '../middleware/socketMiddleware';

// Action pour se connecter au WebSocket
export const connectToSocket = () => ({
  type: SOCKET_ACTIONS.CONNECT
});

// Action pour se déconnecter du WebSocket
export const disconnectFromSocket = () => ({
  type: SOCKET_ACTIONS.DISCONNECT
});

// Nous n'avons plus besoin de cette action car la liste des utilisateurs en ligne
// est maintenant gérée par les événements WebSocket dans le middleware
// export const fetchOnlineUsers = () => (dispatch) => {
//   dispatch(getOnlineUsers());
// }; 