import {
  setConversations,
  setActiveConversation,
  resetUnreadCount,
  setMessageLoading,
  setMessageError
} from '../Store';

import {
  sendMessage,
  sendMarkMessageRead,
  sendUserTyping
} from '../middleware/socketMiddleware';

import {
  fetchConversations,
  fetchConversationMessages
} from '../../services/messageService';

// Action asynchrone pour charger toutes les conversations
export const loadConversations = () => async (dispatch) => {
  try {
    dispatch(setMessageLoading(true));
    const conversations = await fetchConversations();
    dispatch(setConversations(conversations));
    dispatch(setMessageError(null));
  } catch (error) {
    console.error('Erreur lors du chargement des conversations:', error);
    dispatch(setMessageError('Impossible de charger les conversations'));
  } finally {
    dispatch(setMessageLoading(false));
  }
};

// Action pour définir la conversation active
export const setActiveConversationAction = (conversationId) => (dispatch) => {
  dispatch(setActiveConversation(conversationId));
  dispatch(resetUnreadCount(conversationId));
};

// Action pour charger les messages d'une conversation spécifique
export const loadConversationMessages = (conversationId) => async (dispatch) => {
  try {
    dispatch(setMessageLoading(true));
    const messages = await fetchConversationMessages(conversationId);
    
    // Mettre à jour les messages dans la conversation
    const conversation = {
      _id: conversationId,
      messages: messages
    };
    
    dispatch(setConversations([conversation]));
    dispatch(setMessageError(null));
  } catch (error) {
    console.error('Erreur lors du chargement des messages:', error);
    dispatch(setMessageError('Impossible de charger les messages'));
  } finally {
    dispatch(setMessageLoading(false));
  }
};

// Action pour envoyer un message
export const sendMessageAction = (conversationId, content, recipientId) => (dispatch) => {
  dispatch(sendMessage(conversationId, content, recipientId));
};

// Action pour marquer un message comme lu
export const markMessageAsReadAction = (messageId) => (dispatch) => {
  dispatch(sendMarkMessageRead(messageId));
};

// Action pour indiquer que l'utilisateur est en train de taper
export const userTypingAction = (conversationId) => (dispatch) => {
  dispatch(sendUserTyping(conversationId));
}; 