import { connectSocket, disconnectSocket, getOnlineUsers } from '../middleware/socketMiddleware';

// Action pour se connecter au WebSocket
export const connectToSocket = () => (dispatch) => {
  dispatch(connectSocket());
};

// Action pour se déconnecter du WebSocket
export const disconnectFromSocket = () => (dispatch) => {
  dispatch(disconnectSocket());
};

// Action pour récupérer la liste des utilisateurs en ligne
export const fetchOnlineUsers = () => (dispatch) => {
  dispatch(getOnlineUsers());
}; 