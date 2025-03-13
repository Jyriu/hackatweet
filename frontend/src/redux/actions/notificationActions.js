import {
  setNotifications,
  setNotificationLoading,
  setNotificationError,
  markAsRead,
  markAllAsRead,
  setUnreadCount
} from '../Store';

// Import des services
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount
} from '../../services/notificationService';

// Action asynchrone pour charger les notifications
export const loadNotifications = () => async (dispatch) => {
  try {
    dispatch(setNotificationLoading(true));
    const notifications = await fetchNotifications();
    dispatch(setNotifications(notifications));
    dispatch(setNotificationError(null));
    
    // Calculer le nombre de notifications non lues
    const unreadCount = notifications.filter(notif => !notif.read).length;
    dispatch(setUnreadCount(unreadCount));
  } catch (error) {
    console.error('Erreur lors du chargement des notifications:', error);
    dispatch(setNotificationError('Impossible de charger les notifications'));
  } finally {
    dispatch(setNotificationLoading(false));
  }
};

// Action asynchrone pour récupérer uniquement le nombre de notifications non lues
export const loadUnreadCount = () => async (dispatch) => {
  try {
    const count = await getUnreadNotificationsCount();
    dispatch(setUnreadCount(count));
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
  }
};

// Action asynchrone pour marquer une notification comme lue
export const markNotificationRead = (notificationId) => async (dispatch) => {
  try {
    await markNotificationAsRead(notificationId);
    dispatch(markAsRead(notificationId));
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
  }
};

// Action asynchrone pour marquer toutes les notifications comme lues
export const markAllNotificationsRead = () => async (dispatch) => {
  try {
    await markAllNotificationsAsRead();
    dispatch(markAllAsRead());
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
  }
}; 