import {
  setConversations,
  setActiveConversation,
  resetUnreadCount,
  setMessageLoading,
  setMessageError
} from '../Store';

import {
  fetchConversations,
  createConversation as createConversationAPI
} from '../../services/messageService';

// Action asynchrone pour charger toutes les conversations
export const loadConversations = () => async (dispatch) => {
  try {
    console.log('⏳ Chargement des conversations...');
    dispatch(setMessageLoading(true));
    const conversations = await fetchConversations();
    console.log('✅ Conversations reçues:', conversations);
    
    if (Array.isArray(conversations)) {
      // Le Store attend un tableau, donc on envoie directement le tableau
      dispatch(setConversations(conversations));
    } else {
      console.log('⚠️ Format incorrect de conversations:', conversations);
      // Si ce n'est pas un tableau, on crée un tableau vide
      dispatch(setConversations([]));
    }
    
    dispatch(setMessageError(null));
  } catch (error) {
    console.error('❌ Erreur lors du chargement des conversations:', error);
    dispatch(setMessageError('Impossible de charger les conversations'));
  } finally {
    dispatch(setMessageLoading(false));
  }
};

// Action pour définir la conversation active
export const setActiveConversationAction = (conversationId) => (dispatch) => {
  console.log('🔄 Définition de la conversation active:', conversationId);
  dispatch(setActiveConversation(conversationId));
  dispatch(resetUnreadCount(conversationId));
};

// Action pour créer une nouvelle conversation
export const createConversationAction = (recipientId) => async (dispatch) => {
  try {
    console.log('⏳ Création d\'une conversation avec:', recipientId);
    dispatch(setMessageLoading(true));
    const conversation = await createConversationAPI(recipientId);
    console.log('✅ Conversation créée:', conversation);
    
    // Ajouter la nouvelle conversation au store
    dispatch(setConversations([conversation]));
    
    // Définir la nouvelle conversation comme active
    dispatch(setActiveConversation(conversation._id));
    
    dispatch(setMessageError(null));
    return conversation;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la conversation:', error);
    dispatch(setMessageError('Impossible de créer la conversation'));
    throw error;
  } finally {
    dispatch(setMessageLoading(false));
  }
}; 