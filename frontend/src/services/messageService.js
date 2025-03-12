import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// Récupérer toutes les conversations d'un utilisateur
export const fetchConversations = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/conversations`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    throw error;
  }
};

// Récupérer les messages d'une conversation spécifique
export const fetchConversationMessages = async (conversationId) => {
  try {
    const response = await axios.get(`${API_URL}/api/conversations/${conversationId}/messages`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des messages de la conversation ${conversationId}:`, error);
    throw error;
  }
};

// Créer une nouvelle conversation
export const createConversation = async (recipientId) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/conversations`,
      { recipientId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création de la conversation:', error);
    throw error;
  }
};

// Envoyer un message via API REST (alternative au WebSocket)
export const sendMessageAPI = async (conversationId, content) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/conversations/${conversationId}/messages`,
      { content },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message dans la conversation ${conversationId}:`, error);
    throw error;
  }
};

// Marquer un message comme lu via API REST (alternative au WebSocket)
export const markMessageAsReadAPI = async (messageId) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/messages/${messageId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors du marquage du message ${messageId} comme lu:`, error);
    throw error;
  }
}; 