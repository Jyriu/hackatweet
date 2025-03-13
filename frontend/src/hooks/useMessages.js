import { useEffect, useCallback, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadConversationMessages,
  sendMessageAction,
  markMessageAsReadAction
} from '../redux/actions/messageActions';
import { 
  sendUserTyping, 
  updateMessageStatusAction,
  markConversationAsReadAction
} from '../redux/middleware/socketMiddleware';

/**
 * Hook personnalisé pour les messages
 * Fournit des fonctions pour envoyer, lire et gérer les messages
 */
export const useMessages = () => {
  const dispatch = useDispatch();
  const { loading, error, isFetchingMessages } = useSelector(state => state.messages);
  const userFromStore = useSelector(state => state.user.currentUser);
  const activeConversationId = useSelector(state => state.messages.activeConversation);
  const conversations = useSelector(state => state.messages.conversations || {});
  const socket = useSelector(state => state.socket.connected);
  const onlineUsers = useSelector(state => state.socket.onlineUsers || []);
  
  // Fonction pour normaliser l'utilisateur (peut être imbriqué ou direct)
  const normalizeUser = (userObj) => {
    if (!userObj) return null;
    
    // Si userObj a une propriété user, c'est une structure imbriquée
    if (userObj.user && typeof userObj.user === 'object') {
      console.log('📋 Structure utilisateur imbriquée détectée, normalisation');
      return userObj.user;
    }
    
    // Sinon c'est déjà l'utilisateur direct
    return userObj;
  };
  
  // Utilisateur normalisé
  const user = useMemo(() => normalizeUser(userFromStore), [userFromStore]);
  
  // État pour suivre qui est en train d'écrire
  const [typingUsers, setTypingUsers] = useState({});
  
  // Obtenir les messages pour la conversation active
  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;
  const activeMessages = activeConversation?.messages || [];

  // Écouter les événements de saisie
  useEffect(() => {
    if (socket) {
      // Écouter les événements sur le socket depuis ce hook
      const socket = window.socket;
      
      if (!socket) return;
      
      // Écouter l'événement user_typing pour savoir qui est en train d'écrire
      const handleUserTyping = ({ conversationId, userId, username, isTyping }) => {
        if (conversationId === activeConversationId && userId !== user?._id) {
          console.log(`✍️ ${username || 'Utilisateur'} est ${isTyping ? 'en train d\'écrire' : 'a arrêté d\'écrire'}`);
          
          setTypingUsers(prev => {
            if (isTyping) {
              // Ajouter l'utilisateur à la liste des typingUsers
              return { ...prev, [userId]: { timestamp: Date.now(), username } };
            } else {
              // Retirer l'utilisateur de la liste
              const { [userId]: _, ...rest } = prev;
              return rest;
            }
          });
        }
      };
      
      socket.on('user_typing', handleUserTyping);
      
      // Nettoyer l'effet quand le composant est démonté
      return () => {
        socket.off('user_typing', handleUserTyping);
      };
    }
  }, [socket, activeConversationId, user]);
  
  // Nettoyer les typingUsers après un délai
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const updated = {};
        let hasChanged = false;
        
        // Garder uniquement les utilisateurs qui ont tapé dans les 5 dernières secondes
        Object.entries(prev).forEach(([userId, data]) => {
          if (now - data.timestamp < 5000) {
            updated[userId] = data;
          } else {
            hasChanged = true;
          }
        });
        
        return hasChanged ? updated : prev;
      });
    }, 1000); // Vérifier toutes les secondes
    
    return () => clearInterval(interval);
  }, []);

  // Charger les messages de la conversation active quand elle change
  useEffect(() => {
    if (activeConversationId) {
      dispatch(loadConversationMessages(activeConversationId));
      
      // Marquer la conversation comme lue quand on la sélectionne
      if (socket) {
        dispatch(markConversationAsReadAction(activeConversationId));
      }
    }
  }, [activeConversationId, dispatch, socket]);

  // Fonctions pour la gestion des messages (avec useCallback pour optimiser les rendus)
  const sendMessage = useCallback((conversationId, content, recipientId) => {
    if (!content.trim()) {
      console.log('❌ Contenu du message vide, envoi abandonné');
      return;
    }
    
    if (!conversationId) {
      console.error('❌ ID de conversation manquant pour l\'envoi du message');
      return;
    }
    
    // Vérifier si un utilisateur est connecté
    if (!user) {
      console.error("❌ Impossible d'envoyer le message: utilisateur non connecté dans useMessages");
      console.log("État brut de l'utilisateur:", userFromStore);
      
      // Récupérer l'utilisateur depuis localStorage en dernier recours
      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log("🔑 Token trouvé, tentative de récupération de l'utilisateur...");
        } else {
          console.error("❌ Pas de token trouvé dans localStorage");
        }
      } catch (error) {
        console.error("❌ Erreur lors de la vérification du localStorage:", error);
      }
      return;
    }
    
    console.log("👤 Utilisateur vérifié dans useMessages avant envoi:", user._id, user.username);
    console.log("📧 Envoi de message:", { conversationId, content: content.substring(0, 20) + (content.length > 20 ? '...' : ''), recipientId });
    
    // Vérifier si le socket est connecté
    console.log(`Socket connecté: ${socket ? "OUI" : "NON"}`);
    
    // Vérifier si le destinataire est en ligne
    const isRecipientOnline = recipientId && onlineUsers.some(id => {
      const normalizedId = typeof id === 'object' ? id.userId?.toString() : id?.toString();
      return normalizedId === recipientId.toString();
    });
    console.log(`Destinataire ${recipientId} en ligne: ${isRecipientOnline ? "OUI" : "NON"}`);
    
    // Message de débogage sur la stratégie d'envoi
    console.log(`Stratégie d'envoi: ${socket ? "WebSocket puis fallback API" : "API REST directement"}`);
    
    // Utiliser la fonction d'action Redux pour envoyer le message
    // La fonction sendMessageAction essaiera d'abord WebSocket puis fallback sur API REST
    return dispatch(sendMessageAction(conversationId, content, recipientId));
  }, [dispatch, user, userFromStore, socket, onlineUsers]);

  const markMessageRead = useCallback((messageId) => {
    if (!messageId) return;
    dispatch(markMessageAsReadAction(messageId));
  }, [dispatch]);

  // Fonction pour indiquer que l'utilisateur est en train d'écrire
  const indicateTyping = useCallback((conversationId, isTyping = true) => {
    if (!conversationId || !socket) return;
    dispatch(sendUserTyping(conversationId, isTyping));
  }, [dispatch, socket]);
  
  // Fonction pour mettre à jour le statut d'un message
  const updateMessageStatusManually = useCallback((messageId, status) => {
    if (!messageId || !status || !socket) return;
    dispatch(updateMessageStatusAction(messageId, status));
  }, [dispatch, socket]);
  
  // Fonction pour réessayer l'envoi d'un message échoué
  const retryFailedMessage = useCallback((message) => {
    if (!message || !message.conversation || !message.content) return;
    
    console.log('🔄 Réessai d\'envoi du message:', message);
    
    // Récupérer les informations nécessaires
    const conversationId = message.conversation;
    const content = message.content;
    const recipientId = message.recipient?._id || message.recipient;
    
    // Renvoyer le message
    return dispatch(sendMessageAction(conversationId, content, recipientId));
  }, [dispatch]);

  return {
    loading,
    error,
    isFetchingMessages,
    activeMessages,
    typingUsers: Object.values(typingUsers),
    sendMessage,
    markMessageRead,
    indicateTyping,
    updateMessageStatus: updateMessageStatusManually,
    retryFailedMessage,
    markConversationAsRead: useCallback((conversationId) => {
      if (!conversationId || !socket) return;
      dispatch(markConversationAsReadAction(conversationId));
    }, [dispatch, socket])
  };
}; 