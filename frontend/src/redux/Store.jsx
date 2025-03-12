import { configureStore, createSlice } from "@reduxjs/toolkit";
import socketMiddleware from "./middleware/socketMiddleware";

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
      const conversationsMap = {};
      action.payload.forEach(conv => {
        conversationsMap[conv._id] = conv;
      });
      state.conversations = conversationsMap;
    },
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.conversations[conversationId]) {
        state.conversations[conversationId] = {
          _id: conversationId,
          messages: [],
          participants: message.participants || [],
          unreadCount: 0,
        };
      }
      state.conversations[conversationId].messages = [
        ...state.conversations[conversationId].messages || [],
        message
      ];
      
      if (state.activeConversation !== conversationId && !message.isFromCurrentUser) {
        state.conversations[conversationId].unreadCount = 
          (state.conversations[conversationId].unreadCount || 0) + 1;
      }
    },
    markMessageAsRead: (state, action) => {
      const { conversationId, messageId, userId } = action.payload;
      if (state.conversations[conversationId]) {
        const message = state.conversations[conversationId].messages.find(m => m._id === messageId);
        if (message && !message.readBy.includes(userId)) {
          message.readBy.push(userId);
        }
      }
    },
    resetUnreadCount: (state, action) => {
      const conversationId = action.payload;
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].unreadCount = 0;
      }
    },
    setMessageLoading: (state, action) => {
      state.loading = action.payload;
    },
    setMessageError: (state, action) => {
      state.error = action.payload;
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
  setNotificationError 
} = notificationSlice.actions;
export const { 
  setConversations, 
  setActiveConversation, 
  addMessage, 
  markMessageAsRead,
  resetUnreadCount,
  setMessageLoading,
  setMessageError 
} = messageSlice.actions;
export const { 
  setConnected, 
  setSocketError, 
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser
} = socketSlice.actions;

// Configurer le store avec tous les slices
export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    tweets: tweetSlice.reducer,
    notifications: notificationSlice.reducer,
    messages: messageSlice.reducer,
    socket: socketSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware()
      .concat(socketMiddleware),
});
