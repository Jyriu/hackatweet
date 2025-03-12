import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadNotifications, markNotificationRead, markAllNotificationsRead } from '../redux/actions/notificationActions';

// Hook personnalisé pour les notifications
export const useNotifications = () => {
  const dispatch = useDispatch();
  const { items, unreadCount, loading, error } = useSelector(state => state.notifications);
  const user = useSelector(state => state.user.currentUser);

  // Charger les notifications quand l'utilisateur se connecte
  useEffect(() => {
    if (user) {
      dispatch(loadNotifications());
    }
  }, [user, dispatch]);

  // Fonctions utilitaires
  const markAsRead = (notificationId) => {
    dispatch(markNotificationRead(notificationId));
  };

  const markAllAsRead = () => {
    dispatch(markAllNotificationsRead());
  };

  return {
    notifications: items,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: () => dispatch(loadNotifications())
  };
}; 