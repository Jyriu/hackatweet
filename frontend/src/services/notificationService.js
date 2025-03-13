import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// Récupérer toutes les notifications d'un utilisateur
export const fetchNotifications = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    throw error;
  }
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    throw error;
  }
};

// Marquer toutes les notifications comme lues
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await axios.put(
      `${API_URL}/api/notifications/mark-all-read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    throw error;
  }
};

// Supprimer une notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/notifications/${notificationId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    throw error;
  }
};

// Récupérer le nombre de notifications non lues
export const getUnreadNotificationsCount = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/notifications/unread`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.length; // Retourne le nombre d'éléments dans le tableau
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
    return 0; // En cas d'erreur, retourne 0 par défaut
  }
}; 