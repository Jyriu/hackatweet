import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { fetchNotifications, getUnreadNotificationsCount } from '../services/notificationService';
import { UserContext } from './UserContext';

// Création du contexte
export const NotificationContext = createContext();

// Provider du contexte
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const { user } = useContext(UserContext);

  // Initialisation du socket
  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });
      
      setSocket(newSocket);
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  // Écouteurs d'événements du socket
  useEffect(() => {
    if (socket && user) {
      // Écouter les nouvelles notifications
      socket.on('new_notification', (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
      
      return () => {
        socket.off('new_notification');
      };
    }
  }, [socket, user]);

  // Charger les notifications au démarrage
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Fonction pour charger les notifications
  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await fetchNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger le nombre de notifications non lues
  const loadUnreadCount = async () => {
    if (!user) return;
    
    try {
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Erreur lors du chargement du nombre de notifications non lues:', err);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = (notificationId) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Mettre à jour le compteur de notifications non lues
    const notification = notifications.find(n => n._id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  // Ajouter une nouvelle notification
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Supprimer une notification
  const removeNotification = (notificationId) => {
    const notification = notifications.find(n => n._id === notificationId);
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    
    // Mettre à jour le compteur si nécessaire
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 