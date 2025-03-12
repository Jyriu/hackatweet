import {
  setNotifications,
  setNotificationLoading,
  setNotificationError,
  markAsRead,
  markAllAsRead
} from '../Store';

// Import des services
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../services/notificationService';

// Action asynchrone pour charger les notifications
export const loadNotifications = () => async (dispatch) => {
  try {
    dispatch(setNotificationLoading(true));
    const notifications = await fetchNotifications();
    dispatch(setNotifications(notifications));
    dispatch(setNotificationError(null));
  } catch (error) {
    console.error('Erreur lors du chargement des notifications:', error);
    dispatch(setNotificationError('Impossible de charger les notifications'));
  } finally {
    dispatch(setNotificationLoading(false));
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