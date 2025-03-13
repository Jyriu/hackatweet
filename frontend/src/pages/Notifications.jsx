import React, { useState, useEffect } from "react";
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
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
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
  const { user } = useAuth();
  const { notifications, loading, error, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all');

  // Filtrer les notifications lorsque les notifications ou le filtre changent
  useEffect(() => {
    if (filterType === 'all') {
      setFilteredNotifications(notifications);
    } else {
      setFilteredNotifications(notifications.filter(notification => notification.type === filterType));
    }
  }, [notifications, filterType]);

  // Gérer le changement de filtre
  const handleFilterChange = (event, newValue) => {
    setFilterType(newValue);
  };

  // Récupérer l'icône en fonction du type de notification
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FavoriteIcon color="error" />;
      case 'abonnement':
        return <PersonAddIcon color="primary" />;
      case 'commentaire':
        return <ChatIcon color="info" />;
      case 'retweet':
        return <RepeatIcon color="success" />;
      case 'mention':
        return <ChatIcon color="warning" />;
      default:
        return <ChatIcon />;
    }
  };

  // Récupérer le texte de la notification en fonction de son type
  const getNotificationText = (notification) => {
    const username = notification.triggeredBy?.username || 'Un utilisateur';
    switch (notification.type) {
      case 'like':
        return `${username} a aimé votre tweet`;
      case 'abonnement':
        return `${username} a commencé à vous suivre`;
      case 'commentaire':
        return `${username} a commenté votre tweet`;
      case 'retweet':
        return `${username} a retweeté votre tweet`;
      case 'mention':
        return `${username} vous a mentionné dans un tweet`;
      default:
        return notification.content || 'Nouvelle notification';
    }
  };

  // Formater la date de notification
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    // Si la notification date d'aujourd'hui, afficher l'heure
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Si la notification date d'hier
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }

    // Sinon, afficher la date
    return date.toLocaleDateString();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" component="h1">
          Notifications
        </Typography>
        <Button 
          startIcon={<MarkChatReadIcon />} 
          onClick={markAllAsRead}
          disabled={loading || notifications.every(n => n.read)}
          color="primary"
          variant="outlined"
          size="small"
        >
          Tout marquer comme lu
        </Button>
      </Box>

      <Paper sx={{ mb: 2 }}>
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
          <Tab label="Commentaires" value="commentaire" />
          <Tab label="Abonnements" value="abonnement" />
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
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {notification.content && notification.content !== getNotificationText(notification) 
                            ? notification.content 
                            : null}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {formatNotificationDate(notification.createdAt)}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default Notifications; 