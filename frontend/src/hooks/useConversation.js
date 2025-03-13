import { useEffect, useCallback } from 'react';
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
  const { 
    conversations, 
    activeConversation, 
    loading, 
    error, 
    isFetchingMessages 
  } = useSelector(state => state.messages);
  const user = useSelector(state => state.user.currentUser);
  const onlineUsers = useSelector(state => state.socket.onlineUsers);

  // Charger les conversations quand l'utilisateur se connecte
  useEffect(() => {
    if (user) {
      dispatch(loadConversations());
    }
  }, [user, dispatch]);

  // Fonctions pour gérer les conversations - utiliser useCallback pour éviter des re-renders inutiles
  const setActiveConversation = useCallback((conversationId) => {
    dispatch(setActiveConversationAction(conversationId));
  }, [dispatch]);

  const createConversation = useCallback(async (recipientId) => {
    try {
      return await dispatch(createConversationAction(recipientId));
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      return null;
    }
  }, [dispatch]);

  // Vérifier si un utilisateur est en ligne
  const isUserOnline = useCallback((userId) => {
    if (!userId) {
      console.log('❌ isUserOnline: ID utilisateur manquant');
      return false;
    }
    
    // L'utilisateur actuel est toujours considéré comme en ligne
    if (user && user._id && userId.toString() === user._id.toString()) {
      return true;
    }
    
    // Vérifier que la liste des utilisateurs en ligne est bien un tableau
    if (!Array.isArray(onlineUsers)) {
      console.log('⚠️ isUserOnline: Liste des utilisateurs en ligne invalide', onlineUsers);
      return false;
    }
    
    // Normaliser l'ID de l'utilisateur recherché
    const normalizedUserId = userId.toString();
    
    // Vérifier si l'utilisateur est dans la liste des utilisateurs en ligne (après normalisation)
    const isOnline = onlineUsers.some(onlineId => {
      // Normaliser chaque ID dans la liste pour une comparaison cohérente
      const normalizedOnlineId = typeof onlineId === 'object' 
        ? onlineId.userId?.toString() 
        : onlineId?.toString();
      
      return normalizedOnlineId === normalizedUserId;
    });
    
    // Logs détaillés pour le débogage
    console.log(`👤 Vérification de statut pour l'utilisateur ${normalizedUserId}`);
    console.log(`👥 Liste des utilisateurs en ligne (${onlineUsers.length}):`, 
      onlineUsers.map(id => typeof id === 'object' ? id.userId?.toString() : id?.toString()));
    console.log(`🔍 Résultat: ${isOnline ? 'EN LIGNE' : 'HORS LIGNE'}`);
    
    return isOnline;
  }, [onlineUsers, user]);

  // Obtenir la conversation active
  const activeConversationData = activeConversation ? conversations[activeConversation] : null;

  // Convertir l'objet conversations en tableau pour un usage plus facile et trier par date
  const conversationsArray = Object.values(conversations || {}).sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  );
  
  // Logs pour débogage
  useEffect(() => {
    if (activeConversation) {
      console.log(`🔍 Conversation active mise à jour [${activeConversation}]:`, 
        activeConversationData?.messages?.length || 0, 'messages');
    }
  }, [activeConversation, activeConversationData]);

  const refreshOnlineUsers = useCallback(() => {
    // Vérifier que le socket est disponible
    if (window.socket && window.socket.connected) {
      console.log('🔄 Demande manuelle de rafraîchissement des utilisateurs en ligne');
      window.socket.emit('get_online_users');
    } else {
      console.warn('⚠️ Socket non disponible, impossible de rafraîchir les utilisateurs en ligne');
    }
  }, []);

  return {
    conversations: conversationsArray,
    conversationsMap: conversations,
    activeConversation: activeConversationData,
    activeConversationId: activeConversation,
    loading,
    error,
    isFetchingMessages,
    setActiveConversation,
    createConversation,
    isUserOnline,
    refresh: useCallback(() => dispatch(loadConversations()), [dispatch]),
    refreshOnlineUsers
  };
}; 