import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadConversations,
  setActiveConversationAction,
  createConversationAction
} from '../redux/actions/conversationActions';

/**
 * Hook personnalisé pour gérer les conversations
 * Fournit des fonctions pour charger, créer et sélectionner des conversations
 */
export const useConversation = () => {
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

  // Fonctions pour gérer les conversations
  const setActiveConversation = (conversationId) => {
    dispatch(setActiveConversationAction(conversationId));
  };

  const createConversation = async (recipientId) => {
    return dispatch(createConversationAction(recipientId));
  };

  // Vérifier si un utilisateur est en ligne
  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  // Convertir l'objet conversations en tableau pour un usage plus facile
  const conversationsArray = Object.values(conversations || {}).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  return {
    conversations: conversationsArray,
    conversationsMap: conversations,
    activeConversation: activeConversation ? conversations[activeConversation] : null,
    activeConversationId: activeConversation,
    loading,
    error,
    setActiveConversation,
    createConversation,
    isUserOnline,
    refresh: () => dispatch(loadConversations())
  };
}; 