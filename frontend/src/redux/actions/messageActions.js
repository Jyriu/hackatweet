import {
  setConversations,
  setMessageLoading,
  setMessageError,
  setMessagesForConversation,
  setIsFetchingMessages,
  addMessage,
  updateMessageStatus as updateMessageStatusReducer,
  setUser
} from '../Store';

import {
  emitSocketMessage,
  markConversationAsReadAction,
  sendUserTyping
} from '../middleware/socketMiddleware';

import {
  fetchConversationMessages,
  sendMessageAPI
} from '../../services/messageService';

import axios from 'axios';

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

// Action pour charger les messages d'une conversation spécifique
export const loadConversationMessages = (conversationId) => async (dispatch, getState) => {
  // Vérifier que l'ID de conversation est valide
  if (!conversationId) {
    console.error('❌ ID de conversation manquant');
    return;
  }

  console.log('⏳ Chargement des messages pour la conversation:', conversationId);
  
  // Vérifier si nous sommes déjà en train de récupérer les messages
  const { isFetchingMessages } = getState().messages;
  if (isFetchingMessages) {
    console.log('🔄 Chargement des messages déjà en cours, ignoré');
    return;
  }

  try {    
    dispatch(setIsFetchingMessages(true));
    dispatch(setMessageLoading(true));
    
    // Appel API pour récupérer les messages
    // Attention: selon le backend, cet appel peut renvoyer un objet { messages, pagination } au lieu d'un tableau direct
    const response = await fetchConversationMessages(conversationId);
    
    // Vérifier si la réponse est un objet avec une propriété messages, ou directement un tableau
    const rawMessages = response && response.messages ? response.messages : response;
    
    console.log('✅ Messages reçus:', rawMessages?.length || 0, rawMessages);
    
    if (!Array.isArray(rawMessages)) {
      console.error('❌ Format de réponse invalide (messages non sous forme de tableau):', rawMessages);
      dispatch(setMessageError('Format de réponse invalide du serveur'));
      dispatch(setMessageLoading(false));
      dispatch(setIsFetchingMessages(false));
      return;
    }

    // Récupérer l'ID de l'utilisateur connecté pour déterminer si le message vient de lui
    let currentUser = normalizeUser(getState().user.currentUser);
    
    // Si l'utilisateur n'est pas dans le state, essayer de le récupérer
    if (!currentUser || !currentUser._id) {
      console.warn('⚠️ Utilisateur non trouvé lors du chargement des messages, tentative de récupération...');
      
      try {
        // Vérifier si nous avons un token
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('❌ Pas de token dans localStorage');
          dispatch(setMessageError('Vous devez être connecté pour voir les messages'));
          dispatch(setMessageLoading(false));
          dispatch(setIsFetchingMessages(false));
          return;
        }
        
        // Essayer de récupérer les infos utilisateur depuis le API
        try {
          const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data && response.data._id) {
            console.log('✅ Utilisateur récupéré depuis API:', response.data.username);
            currentUser = normalizeUser(response.data);
            
            // Mettre à jour le state Redux avec l'utilisateur récupéré
            dispatch(setUser(currentUser));
          } else {
            console.error('❌ Réponse API invalide:', response.data);
            dispatch(setMessageError('Impossible de vérifier votre identité'));
            dispatch(setMessageLoading(false));
            dispatch(setIsFetchingMessages(false));
            return;
          }
        } catch (error) {
          console.error('❌ Erreur lors de la récupération de l\'utilisateur depuis API:', error);
          dispatch(setMessageError('Impossible de récupérer votre profil'));
          dispatch(setMessageLoading(false));
          dispatch(setIsFetchingMessages(false));
          return;
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération alternative de l\'utilisateur:', error);
        dispatch(setMessageError('Erreur d\'authentification'));
        dispatch(setMessageLoading(false));
        dispatch(setIsFetchingMessages(false));
        return;
      }
    }
    
    if (!currentUser || !currentUser._id) {
      console.error('❌ Utilisateur non connecté ou sans ID');
      dispatch(setMessageError('Veuillez vous reconnecter pour voir les messages'));
      dispatch(setMessageLoading(false));
      dispatch(setIsFetchingMessages(false));
      return;
    }
    
    console.log('👤 Utilisateur connecté:', currentUser._id);
    
    // Traiter chaque message pour déterminer s'il vient de l'utilisateur courant
    // ou si cette propriété est déjà définie dans le message
    const processedMessages = rawMessages.map(msg => {
      // Si la propriété isFromCurrentUser est déjà définie, la respecter
      if (msg.isFromCurrentUser !== undefined) {
        return {
          ...msg,
          conversation: conversationId // S'assurer que l'ID de conversation est inclus
        };
      }
      
      // Sinon déterminer si le message vient de l'utilisateur courant
      let senderId = '';
      
      if (msg.sender) {
        senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
      }
      
      const isFromCurrentUser = senderId && senderId.toString() === currentUser._id.toString();
      
      console.log(`Message ${msg._id || 'sans ID'} - Sender: ${senderId}, CurrentUser: ${currentUser._id}, isFromCurrentUser: ${isFromCurrentUser}`);
      
      return {
        ...msg,
        conversation: conversationId,
        isFromCurrentUser,
        status: msg.status || (isFromCurrentUser ? 'sent' : 'received')
      };
    });
    
    console.log('Messages traités:', processedMessages);
    
    // Dispatcher les messages traités
    dispatch(setMessagesForConversation({
      conversationId,
      messages: processedMessages
    }));
    
    console.log('📝 Messages traités et dispatchés avec propriété isFromCurrentUser');
    
    // Marquer la conversation comme lue si nécessaire
    if (processedMessages.some(msg => !msg.isFromCurrentUser && !msg.read)) {
      dispatch(markConversationAsReadAction(conversationId));
      console.log('📖 Marquage automatique de la conversation comme lue');
    }
    
    // S'assurer de réinitialiser l'erreur si tout s'est bien passé
    dispatch(setMessageError(null));
    
    // Retourner les messages au cas où ils seraient nécessaires ailleurs
    return processedMessages;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des messages:', error);
    dispatch(setMessageError('Impossible de charger les messages'));
    return [];
  } finally {
    dispatch(setMessageLoading(false));
    dispatch(setIsFetchingMessages(false));
  }
};

// Action pour envoyer un message
export const sendMessageAction = (conversationId, content, recipientId) => async (dispatch, getState) => {
  console.log('📤 Envoi d\'un message:', { conversationId, content, recipientId });
  
  // Vérifications préliminaires
  if (!conversationId || !content || !recipientId) {
    console.error('❌ Données invalides pour l\'envoi du message', { conversationId, content, recipientId });
    return;
  }
  
  // Récupérer l'utilisateur actuel depuis le state Redux
  let currentUser = normalizeUser(getState().user.currentUser);
  
  // Si l'utilisateur n'est pas dans le state, essayer de le récupérer du localStorage
  if (!currentUser || !currentUser._id) {
    console.warn('⚠️ Utilisateur non trouvé dans le Redux state, tentative de récupération alternative...');
    
    try {
      // Vérifier si nous avons un token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ Pas de token dans localStorage, impossible d\'envoyer le message');
        return;
      }
      
      // Essayer de récupérer les infos utilisateur depuis le API
      try {
        const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data._id) {
          console.log('✅ Utilisateur récupéré depuis API:', response.data.username);
          currentUser = normalizeUser(response.data);
          
          // Mettre à jour le state Redux avec l'utilisateur récupéré
          dispatch(setUser(currentUser));
        } else {
          console.error('❌ Réponse API invalide:', response.data);
          return;
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'utilisateur depuis API:', error);
        return;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération alternative de l\'utilisateur:', error);
      return;
    }
  }
  
  if (!currentUser || !currentUser._id) {
    console.error('❌ Utilisateur non connecté ou sans ID, impossible d\'envoyer le message');
    return;
  }
  
  console.log('👤 Utilisateur normalisé pour envoi:', currentUser.username);
  
  // Générer un ID temporaire unique
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  // Créer un message temporaire
  const tempMessage = {
    _id: tempId,  // ID temporaire unique
    content,
    sender: currentUser._id,
    recipient: recipientId,
    conversation: conversationId,
    createdAt: new Date().toISOString(),
    isFromCurrentUser: true,  // Important: définir explicitement cette propriété
    status: 'sending',
    isTempMessage: true
  };
  
  console.log('💬 Message temporaire créé:', tempId);
  
  // Ajouter immédiatement le message temporaire au store pour l'affichage
  dispatch(addMessage({
    conversationId,
    message: tempMessage
  }));
  
  try {
    // Tenter d'abord l'envoi via WebSocket
    if (getState().socket.connected) {
      // Émettre l'événement socket pour envoyer le message en temps réel
      dispatch(emitSocketMessage(conversationId, content, recipientId));
      
      // On attend un court instant pour voir si le serveur répond avec un message confirmé
      // Si pas de confirmation après ce délai, on tente l'API REST
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Vérifier si le message temporaire a été remplacé par un message confirmé
      const conversationState = getState().messages.conversations[conversationId];
      const tempMessageStillExists = conversationState?.messages?.some(m => m._id === tempId && m.status === 'sending');
      
      if (!tempMessageStillExists) {
        console.log('✅ Message envoyé avec succès via WebSocket');
        return;
      }
      
      console.log('⚠️ Pas de confirmation WebSocket, tentative via API REST...');
    }
    
    // Envoyer le message via l'API REST
    const sentMessage = await sendMessageAPI(conversationId, content);
    console.log('✅ Message envoyé avec succès via API:', sentMessage);
    
    if (!sentMessage || !sentMessage._id) {
      console.error('❌ Réponse API invalide:', sentMessage);
      throw new Error('Format de réponse API invalide');
    }
    
    // Préparer le message confirmé pour remplacer le temporaire
    const confirmedMessage = {
      ...sentMessage,
      isFromCurrentUser: true,
      status: 'sent',
      _tempId: tempId  // Référence à l'ID temporaire pour le remplacement
    };
    
    // Dispatcher l'action pour remplacer le message temporaire
    dispatch(addMessage({
      conversationId,
      message: confirmedMessage
    }));
    
    return sentMessage;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message:', error);
    
    // Mettre à jour le statut du message temporaire en "failed"
    const failedMessage = {
      ...tempMessage,
      status: 'failed'
    };
    
    dispatch(addMessage({
      conversationId,
      message: failedMessage
    }));
    
    throw error;
  }
};

// Action pour marquer un message comme lu
export const markMessageAsReadAction = (messageId) => (dispatch) => {
  console.log('📝 Marquer le message comme lu:', messageId);
  dispatch(markConversationAsReadAction(messageId));
};

// Action pour indiquer que l'utilisateur est en train de taper
export const userTypingAction = (conversationId) => (dispatch) => {
  dispatch(sendUserTyping(conversationId));
};

// Action pour mettre à jour le statut d'un message
export const updateMessageStatusAction = (messageId, status, conversationId) => (dispatch) => {
  console.log('📝 Mise à jour du statut du message:', { messageId, status, conversationId });
  dispatch(updateMessageStatusReducer({ messageId, status, conversationId }));
}; 