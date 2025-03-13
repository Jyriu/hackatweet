import { configureStore, createSlice, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import socketMiddleware from "./middleware/socketMiddleware";

// Configuration de la persistance
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user', 'tweets', 'notifications'] // Liste des reducers à persister
};

// Slice utilisateur
const userSlice = createSlice({
  name: "user",
  initialState: {
    currentUser: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem('token', action.payload);
      } else {
        localStorage.removeItem('token');
      }
    },
    logout: (state) => {
      state.currentUser = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    setUserLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUserError: (state, action) => {
      state.error = action.payload;
    }
  },
});

const tweetSlice = createSlice({
  name: "tweets",
  initialState: [],
  reducers: {
    setTweets: (state, action) => action.payload,
    addTweet: (state, action) => [...state, action.payload],
  },
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter(notif => !notif.read).length;
    },
    addNotification: (state, action) => {
      state.items = [action.payload, ...state.items];
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action) => {
      const notification = state.items.find(n => n._id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    setNotificationLoading: (state, action) => {
      state.loading = action.payload;
    },
    setNotificationError: (state, action) => {
      state.error = action.payload;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    }
  },
});

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    conversations: {},
    activeConversation: null,
    loading: false,
    error: null,
  },
  reducers: {
    setConversations: (state, action) => {
      if (Array.isArray(action.payload)) {
        // Convertir le tableau en objet avec les IDs comme clés
        const conversationsMap = {};
        action.payload.forEach(conv => {
          if (conv._id) {
            // Si la conversation existe déjà, préserver ses messages
            if (state.conversations[conv._id]) {
              conversationsMap[conv._id] = {
                ...conv,
                messages: state.conversations[conv._id].messages || []
              };
            } else {
              conversationsMap[conv._id] = {
                ...conv,
                messages: []
              };
            }
          }
        });
        state.conversations = conversationsMap;
      } else if (typeof action.payload === 'object' && action.payload !== null) {
        // Si c'est un objet (probablement un mapping de conversations)
        state.conversations = action.payload;
      }
    },
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
      
      // Si une conversation active est définie, réinitialiser son compteur de messages non lus
      if (action.payload && state.conversations[action.payload]) {
        state.conversations[action.payload].unreadCount = 0;
      }
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      
      // S'assurer que la conversation existe
      if (!state.conversations[conversationId]) {
        // Créer une nouvelle entrée de conversation si elle n'existe pas
        const participant = message.isFromCurrentUser ? message.recipient : message.sender;
        state.conversations[conversationId] = {
          _id: conversationId,
          participant,
          messages: [],
          unreadCount: 0,
          lastMessage: null,
          updatedAt: new Date().toISOString()
        };
      }
      
      // S'assurer que le tableau de messages existe
      if (!state.conversations[conversationId].messages) {
        state.conversations[conversationId].messages = [];
      }
      
      // Vérifier si le message existe déjà (éviter les doublons)
      const messageExists = state.conversations[conversationId].messages.some(
        m => m._id === message._id
      );
      
      if (!messageExists) {
        // Ajouter le message
        state.conversations[conversationId].messages.push(message);
        
        // Mettre à jour le dernier message
        state.conversations[conversationId].lastMessage = message;
        state.conversations[conversationId].updatedAt = message.createdAt || new Date().toISOString();
        
        // Incrémenter le compteur de messages non lus si nécessaire
        if (!message.isFromCurrentUser && state.activeConversation !== conversationId) {
          state.conversations[conversationId].unreadCount = 
            (state.conversations[conversationId].unreadCount || 0) + 1;
        }
      }
    },
    markConversationAsRead: (state, action) => {
      const { conversationId, count, userId } = action.payload;
      
      if (state.conversations[conversationId]) {
        // Si nous avons un décompte, c'est notre propre action de lecture
        if (count !== undefined) {
          // Marquer tous les messages comme lus
          if (state.conversations[conversationId].messages) {
            state.conversations[conversationId].messages.forEach(msg => {
              if (!msg.isFromCurrentUser && !msg.read) {
                msg.read = true;
              }
            });
          }
          
          // Réinitialiser le compteur de messages non lus
          state.conversations[conversationId].unreadCount = 0;
        } 
        // Si nous avons un userId, c'est une notification que l'autre utilisateur a lu nos messages
        else if (userId) {
          if (state.conversations[conversationId].messages) {
            state.conversations[conversationId].messages.forEach(msg => {
              if (msg.isFromCurrentUser) {
                msg.read = true;
              }
            });
          }
        }
      }
    },
    setMessagesForConversation: (state, action) => {
      const { conversationId, messages } = action.payload;
      
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages = messages.map(msg => ({
          ...msg,
          isFromCurrentUser: msg.sender._id === state.currentUser?.id
        }));
        
        // Réinitialiser le compteur de messages non lus si c'est la conversation active
        if (state.activeConversation === conversationId) {
          state.conversations[conversationId].unreadCount = 0;
        }
      }
    },
    setMessageLoading: (state, action) => {
      state.loading = action.payload;
    },
    setMessageError: (state, action) => {
      state.error = action.payload;
    },
    resetUnreadCount: (state, action) => {
      const conversationId = action.payload;
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].unreadCount = 0;
      }
    },
  },
});

const socketSlice = createSlice({
  name: "socket",
  initialState: {
    connected: false,
    error: null,
    onlineUsers: [],
  },
  reducers: {
    setConnected: (state, action) => {
      state.connected = action.payload;
    },
    setSocketError: (state, action) => {
      state.error = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    addOnlineUser: (state, action) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    removeOnlineUser: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
    }
  },
});

// Exporter les actions
export const { 
  setUser, 
  setToken, 
  logout, 
  setUserLoading, 
  setUserError 
} = userSlice.actions;
export const { setTweets, addTweet } = tweetSlice.actions;
export const { 
  setNotifications, 
  addNotification, 
  markAsRead, 
  markAllAsRead,
  setNotificationLoading,
  setNotificationError,
  setUnreadCount
} = notificationSlice.actions;
export const { 
  setConversations, 
  setActiveConversation, 
  addMessage, 
  setMessageLoading,
  setMessageError,
  markConversationAsRead,
  setMessagesForConversation,
  resetUnreadCount
} = messageSlice.actions;
export const { 
  setConnected, 
  setSocketError, 
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser
} = socketSlice.actions;

// Combiner les reducers
const rootReducer = combineReducers({
  user: userSlice.reducer,
  tweets: tweetSlice.reducer,
  notifications: notificationSlice.reducer,
  messages: messageSlice.reducer,
  socket: socketSlice.reducer,
});

// Wrapper pour gérer la réinitialisation de l'application
const appReducer = (state, action) => {
  // Quand l'action RESET_APP_STATE est dispatched, on réinitialise tout l'état
  if (action.type === 'RESET_APP_STATE') {
    // On garde uniquement certains paramètres comme les thèmes ou les préférences si nécessaire
    return rootReducer(undefined, action);
  }
  return rootReducer(state, action);
};

// Créer le store avec persistance
const persistedReducer = persistReducer(persistConfig, appReducer);

// Créer le socketMiddleware sans closure
const socketMiddlewareInstance = socketMiddleware();

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(socketMiddlewareInstance),
});

export const persistor = persistStore(store);

// Connecter le socket quand l'application est chargée
// store.dispatch({ type: 'socket/connect' });

export default store;