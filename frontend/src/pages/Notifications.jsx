import React, { useState, useEffect, useContext } from "react";
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Divider, 
  Button, 
  CircularProgress,
  Paper,
  IconButton
} from "@mui/material";
import { UserContext } from "../context/UserContext";
import axios from "axios";
import MarkChatReadIcon from '@mui/icons-material/MarkChatRead';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ChatIcon from '@mui/icons-material/Chat';
import RepeatIcon from '@mui/icons-material/Repeat';
import FilterListIcon from '@mui/icons-material/FilterList';

// Composant pour afficher un message quand il n'y a aucune notification
const EmptyNotifications = ({ filterType }) => (
  <Box 
    sx={{ 
      textAlign: 'center', 
      py: 5, 
      px: 2, 
      bgcolor: 'background.paper',
      borderRadius: 1,
      mt: 2
    }}
  >
    <Typography variant="h6" color="text.secondary" gutterBottom>
      Aucune notification {filterType !== 'all' ? `de type "${filterType}"` : ''}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Les nouvelles notifications apparaîtront ici
    </Typography>
  </Box>
);

// Composant principal des notifications
const Notifications = () => {
  const { user } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Fonction pour récupérer les notifications depuis l'API
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/notifications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotifications(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications :', err);
      setError('Impossible de charger les notifications. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // Charger les notifications au chargement du composant
  useEffect(() => {
    fetchNotifications();

    // Configurer WebSocket pour les notifications en temps réel
    const setupWebSocket = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const socket = new WebSocket(`ws://localhost:5001/ws/notifications?token=${token}`);
      
      socket.onopen = () => {
        console.log('WebSocket connexion établie pour les notifications');
      };
      
      socket.onmessage = (event) => {
        const newNotification = JSON.parse(event.data);
        setNotifications(prev => [newNotification, ...prev]);
      };
      
      socket.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
      };
      
      return () => {
        socket.close();
      };
    };

    const cleanupWs = setupWebSocket();
    return cleanupWs;
  }, [user]);

  // Filtrer les notifications à chaque changement de filtre ou de notifications
  useEffect(() => {
    if (filterType === 'all') {
      setFilteredNotifications(notifications);
      return;
    }
    
    const filtered = notifications.filter(notif => notif.type === filterType);
    setFilteredNotifications(filtered);
  }, [filterType, notifications]);

  // Gérer le changement de filtre
  const handleFilterChange = (event, newValue) => {
    setFilterType(newValue);
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Mettre à jour l'état local
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (err) {
      console.error('Erreur lors du marquage de la notification comme lue:', err);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      await axios.put('http://localhost:5001/api/notifications/read-all', {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Mettre à jour l'état local
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (err) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', err);
    }
  };

  // Fonction pour obtenir l'icône en fonction du type de notification
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FavoriteIcon color="error" />;
      case 'follow':
        return <PersonAddIcon color="primary" />;
      case 'reply':
        return <ChatIcon color="info" />;
      case 'mention':
        return <ChatIcon color="secondary" />;
      case 'retweet':
        return <RepeatIcon color="success" />;
      default:
        return null;
    }
  };

  // Fonction pour formater le texte de la notification
  const getNotificationText = (notification) => {
    const { type, fromUser, content } = notification;
    
    switch (type) {
      case 'like':
        return `${fromUser.username} a aimé votre tweet`;
      case 'follow':
        return `${fromUser.username} vous suit maintenant`;
      case 'reply':
        return `${fromUser.username} a répondu à votre tweet`;
      case 'mention':
        return `${fromUser.username} vous a mentionné dans un tweet`;
      case 'retweet':
        return `${fromUser.username} a retweeté votre tweet`;
      default:
        return 'Nouvelle notification';
    }
  };

  // Formater la date de notification pour l'affichage
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <Container maxWidth="md">
        <Typography variant="h5" align="center" sx={{ mt: 5 }}>
          Veuillez vous connecter pour voir vos notifications
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notifications
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<MarkChatReadIcon />}
          onClick={markAllAsRead}
          disabled={notifications.every(n => n.read)}
        >
          Tout marquer comme lu
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={filterType} 
          onChange={handleFilterChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Toutes" value="all" />
          <Tab label="Mentions" value="mention" />
          <Tab label="J'aime" value="like" />
          <Tab label="Réponses" value="reply" />
          <Tab label="Abonnements" value="follow" />
          <Tab label="Retweets" value="retweet" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" my={4}>
          {error}
        </Typography>
      ) : filteredNotifications.length === 0 ? (
        <EmptyNotifications filterType={filterType} />
      ) : (
        <Paper elevation={2}>
          <List>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    bgcolor: notification.read ? 'inherit' : 'action.hover',
                    transition: 'background-color 0.3s'
                  }}
                  onClick={() => !notification.read && markAsRead(notification._id)}
                >
                  <ListItemAvatar>
                    <Avatar src={notification.fromUser?.avatar}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        component="span"
                        variant="body1"
                        fontWeight={notification.read ? 'normal' : 'bold'}
                      >
                        {getNotificationText(notification)}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          display="block"
                          sx={{ mt: 1 }}
                        >
                          {notification.content && `"${notification.content.substring(0, 60)}${notification.content.length > 60 ? '...' : ''}"`}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 1 }}
                        >
                          {formatNotificationDate(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default Notifications; 