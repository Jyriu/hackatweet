import { configureStore, createSlice, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import socketMiddleware from "./middleware/socketMiddleware";

// Configuration de la persistance
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user', 'tweets', 'notifications', 'messages'] // Liste des reducers à persister
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
    isFetchingMessages: false
  },
  reducers: {
    setConversations: (state, action) => {
      if (Array.isArray(action.payload)) {
        // Convertir le tableau en objet avec les IDs comme clés
        // MAIS préserver les messages existants!
        const conversationsMap = { ...state.conversations };
        
        action.payload.forEach(conv => {
          if (conv._id) {
            if (state.conversations[conv._id]) {
              // Préserver les messages existants
              conversationsMap[conv._id] = {
                ...conv,
                messages: state.conversations[conv._id].messages || []
              };
            } else {
              // Nouvelle conversation sans messages
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
    setMessagesForConversation: (state, action) => {
      const { conversationId, messages } = action.payload;
      
      if (state.conversations[conversationId]) {
        // Remplacer complètement les messages pour éviter les doublons
        // Important: préserver les propriétés isFromCurrentUser des messages entrants
        state.conversations[conversationId].messages = messages;
        
        // Mettre à jour le dernier message
        if (messages.length > 0) {
          state.conversations[conversationId].lastMessage = messages[messages.length - 1];
          state.conversations[conversationId].updatedAt = messages[messages.length - 1].createdAt;
        }
        
        // Réinitialiser le compteur de messages non lus si c'est la conversation active
        if (state.activeConversation === conversationId) {
          state.conversations[conversationId].unreadCount = 0;
        }
      }
    },
    addMessage: (state, action) => {
      // Vérifier la structure de la payload
      const { conversationId, message } = action.payload;
      
      console.log(`📥 Redux: addMessage pour conversation ${conversationId}:`, message);

      // S'assurer que la conversation existe
      if (!state.conversations[conversationId]) {
        console.log('Conversation inexistante, création d\'une nouvelle conversation');
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

      const messages = state.conversations[conversationId].messages;
      
      // Cas spécial: message confirmé remplaçant un message temporaire
      if (message._id && !message.isTempMessage && message._tempId) {
        // Essayer de trouver un message temporaire correspondant
        const tempIndex = messages.findIndex(m => m._id === message._tempId);
        if (tempIndex !== -1) {
          console.log(`🔀 Remplacement du message temporaire ${message._tempId} par le message confirmé ${message._id}`);
          // Remplacer le message temporaire par le message confirmé
          messages[tempIndex] = {
            ...message,
            isFromCurrentUser: true, // Conserver cette propriété car c'est un message de l'utilisateur
            status: message.status || 'sent'
          };
          return; // Terminer ici
        }
      }
      
      // Vérifier si un message avec le même ID existe déjà
      if (message._id) {
        const existingIndex = messages.findIndex(m => m._id === message._id);
        if (existingIndex !== -1) {
          console.log(`🔄 Mise à jour du message existant ${message._id}`);
          // Mettre à jour le message existant
          messages[existingIndex] = {
            ...messages[existingIndex],
            ...message,
            // Conserver la propriété isFromCurrentUser
            isFromCurrentUser: message.isFromCurrentUser !== undefined 
              ? message.isFromCurrentUser
              : messages[existingIndex].isFromCurrentUser
          };
          
          // Mettre à jour le dernier message
          if (state.conversations[conversationId].lastMessage?._id === message._id) {
            state.conversations[conversationId].lastMessage = messages[existingIndex];
          }
          
          return; // Terminer ici
        }
      }
      
      // Si c'est un nouveau message, l'ajouter
      console.log(`➕ Ajout d'un nouveau message ${message._id || 'temporaire'} à la conversation ${conversationId}`);
      
      // Conserver la propriété isFromCurrentUser explicitement
      const messageToAdd = {
        ...message,
        isFromCurrentUser: message.isFromCurrentUser === true
      };
      
      messages.push(messageToAdd);
      
      // Mettre à jour le dernier message
      state.conversations[conversationId].lastMessage = messageToAdd;
      state.conversations[conversationId].updatedAt = messageToAdd.createdAt || new Date().toISOString();
      
      // Incrémenter le compteur de messages non lus si ce n'est pas la conversation active
      // et si le message n'est pas de l'utilisateur courant
      if (state.activeConversation !== conversationId && !messageToAdd.isFromCurrentUser) {
        state.conversations[conversationId].unreadCount = 
          (state.conversations[conversationId].unreadCount || 0) + 1;
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
    setIsFetchingMessages: (state, action) => {
      state.isFetchingMessages = action.payload;
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status, conversationId } = action.payload;
      
      if (messageId && conversationId && state.conversations[conversationId]) {
        const messages = state.conversations[conversationId].messages;
        if (messages) {
          const messageIndex = messages.findIndex(m => m._id === messageId);
          if (messageIndex !== -1) {
            messages[messageIndex].status = status;
            
            // Si le message est marqué comme lu, mettre à jour la propriété read
            if (status === 'read') {
              messages[messageIndex].read = true;
            }
          }
        }
      }
    }
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
  resetUnreadCount,
  setIsFetchingMessages,
  updateMessageStatus
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

// Middleware pour le débogage des actions Redux
const loggerMiddleware = store => next => action => {
  console.group(`🔄 ACTION: ${action.type}`);
  console.log('État précédent:', store.getState());
  console.log('Action:', action);
  const result = next(action);
  console.log('État suivant:', store.getState());
  console.groupEnd();
  return result;
};

// Créer le socketMiddleware sans closure
const socketMiddlewareInstance = socketMiddleware();

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(socketMiddlewareInstance, loggerMiddleware),
});

export const persistor = persistStore(store);

// Connecter le socket quand l'application est chargée
// store.dispatch({ type: 'socket/connect' });

export default store;