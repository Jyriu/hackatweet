import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadConversations,
  loadConversationMessages,
  setActiveConversationAction,
  sendMessageAction,
  markMessageAsReadAction,
  userTypingAction
} from '../redux/actions/messageActions';

// Hook personnalisé pour les messages
export const useMessages = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversation, loading, error } = useSelector(state => state.messages);
  const user = useSelector(state => state.user.currentUser);
  const onlineUsers = useSelector(state => state.socket.onlineUsers);

  // Charger les conversations quand l'utilisateur se connecte
  useEffect(() => {
    if (user) {
      dispatch(loadConversations());
    }
  }, [user, dispatch]);

  // Fonctions utilitaires
  const setActiveConversation = (conversationId) => {
    dispatch(setActiveConversationAction(conversationId));
    // Charger les messages de cette conversation
    dispatch(loadConversationMessages(conversationId));
  };

  const sendMessage = (conversationId, content, recipientId) => {
    dispatch(sendMessageAction(conversationId, content, recipientId));
  };

  const markMessageRead = (messageId) => {
    dispatch(markMessageAsReadAction(messageId));
  };

  const userTyping = (conversationId) => {
    dispatch(userTypingAction(conversationId));
  };

  // Vérifier si un utilisateur est en ligne
  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  return {
    conversations,
    activeConversation: activeConversation ? conversations[activeConversation] : null,
    loading,
    error,
    setActiveConversation,
    sendMessage,
    markMessageRead,
    userTyping,
    isUserOnline,
    refresh: () => dispatch(loadConversations())
  };
}; 