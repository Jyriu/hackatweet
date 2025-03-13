import {
  setConversations,
  setMessageLoading,
  setMessageError
} from '../Store';

import {
  sendMessage,
  sendMarkConversationRead,
  sendUserTyping
} from '../middleware/socketMiddleware';

import {
  fetchConversationMessages
} from '../../services/messageService';

// Action pour charger les messages d'une conversation spécifique
export const loadConversationMessages = (conversationId) => async (dispatch) => {
  try {
    console.log('⏳ Chargement des messages pour la conversation:', conversationId);
    dispatch(setMessageLoading(true));
    const messages = await fetchConversationMessages(conversationId);
    console.log('✅ Messages reçus:', messages);
    
    // Mettre à jour les messages dans la conversation
    const conversation = {
      _id: conversationId,
      messages: messages
    };
    
    // Wrapper dans un tableau car setConversations attend un tableau
    dispatch(setConversations([conversation]));
    dispatch(setMessageError(null));
  } catch (error) {
    console.error('❌ Erreur lors du chargement des messages:', error);
    dispatch(setMessageError('Impossible de charger les messages'));
  } finally {
    dispatch(setMessageLoading(false));
  }
};

// Action pour envoyer un message
export const sendMessageAction = (conversationId, content, recipientId) => (dispatch) => {
  console.log('📤 Envoi d\'un message:', { conversationId, content, recipientId });
  dispatch(sendMessage(conversationId, content, recipientId));
};

// Action pour marquer un message comme lu
export const markMessageAsReadAction = (messageId) => (dispatch) => {
  console.log('📝 Marquer le message comme lu:', messageId);
  dispatch(sendMarkConversationRead(messageId));
};

// Action pour indiquer que l'utilisateur est en train de taper
export const userTypingAction = (conversationId) => (dispatch) => {
  dispatch(sendUserTyping(conversationId));
}; 