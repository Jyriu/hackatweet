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

// Créer une nouvelle conversation ou récupérer une existante
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
    console.error('Erreur lors de la création/récupération de la conversation:', error);
    throw error;
  }
};

// Envoyer un message via API REST (alternative au WebSocket)
export const sendMessageAPI = async (conversationId, content) => {
  try {
    console.log('🚀 Envoi du message via API:', { conversationId, content: content.substring(0, 20) + (content.length > 20 ? '...' : '') });
    
    if (!conversationId) {
      throw new Error('ID de conversation manquant');
    }
    
    if (!content || content.trim() === '') {
      throw new Error('Contenu du message vide');
    }
    
    // Vérifier que le token est disponible
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié - token manquant');
    }
    
    // URL correcte correspondant à la route du backend
    const response = await axios.post(
      `${API_URL}/api/conversations/message`,
      { 
        conversationId,
        content 
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('✅ Message envoyé avec succès via API, réponse:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi du message dans la conversation ${conversationId}:`, error);
    console.error('Détails de l\'erreur:', error.response?.data || error.message);
    throw error;
  }
};

// Marquer tous les messages d'une conversation comme lus via API REST
export const markConversationAsReadAPI = async (conversationId) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/conversations/${conversationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors du marquage des messages de la conversation ${conversationId} comme lus:`, error);
    throw error;
  }
};

// Supprimer une conversation
export const deleteConversation = async (conversationId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/conversations/${conversationId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la suppression de la conversation ${conversationId}:`, error);
    throw error;
  }
}; 