import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadConversationMessages,
  sendMessageAction,
  markMessageAsReadAction,
  userTypingAction
} from '../redux/actions/messageActions';
import { useConversation } from './useConversation';

// Hook personnalisé pour les messages
export const useMessages = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.messages);
  const user = useSelector(state => state.user.currentUser);
  
  // Utiliser le hook useConversation pour accéder aux conversations
  const { activeConversation, activeConversationId } = useConversation();

  // Charger les messages de la conversation active quand elle change
  useEffect(() => {
    if (activeConversationId) {
      dispatch(loadConversationMessages(activeConversationId));
    }
  }, [activeConversationId, dispatch]);

  // Fonctions pour la gestion des messages
  const sendMessage = (conversationId, content, recipientId) => {
    dispatch(sendMessageAction(conversationId, content, recipientId));
  };

  const markMessageRead = (messageId) => {
    dispatch(markMessageAsReadAction(messageId));
  };

  const userTyping = (conversationId) => {
    dispatch(userTypingAction(conversationId));
  };

  return {
    loading,
    error,
    sendMessage,
    markMessageRead,
    userTyping
  };
}; 