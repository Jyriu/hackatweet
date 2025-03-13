import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  IconButton,
  Badge,
  CircularProgress,
  Button,
  Alert,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import RefreshIcon from '@mui/icons-material/Refresh';

const ConversationList = ({
  conversations = {},
  activeConversationId,
  onSelect,
  onNewConversation,
  isUserOnline,
  loading,
  error,
  onRefreshOnlineUsers,
}) => {
  const conversationArray = Object.values(conversations);

  // Trier les conversations par date du dernier message
  const sortedConversations = [...conversationArray].sort((a, b) => {
    const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
    const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
    return dateB - dateA;
  });

  // Formater la date relative (ex: "il y a 2 heures")
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: fr
    });
  };

  // Tronquer le texte s'il est trop long
  const truncateText = (text, maxLength = 40) => {
    if (!text) return '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          p: 2, 
          borderBottom: '1px solid #e0e0e0' 
        }}
      >
        <Typography variant="h6">Conversations</Typography>
        <Box>
          {onRefreshOnlineUsers && (
            <Tooltip title="Rafraîchir les statuts en ligne">
              <IconButton 
                color="primary" 
                onClick={onRefreshOnlineUsers}
                size="small"
                sx={{ mr: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
          <IconButton 
            color="primary" 
            onClick={onNewConversation}
            size="small"
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Box>
      
      {sortedConversations.length === 0 ? (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          p={3}
          flexGrow={1}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Aucune conversation
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={onNewConversation}
          >
            Nouvelle conversation
          </Button>
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
          {sortedConversations.map((conversation) => {
            const isActive = conversation._id === activeConversationId;
            const isOnline = isUserOnline(conversation.participant?._id);
            
            return (
              <React.Fragment key={conversation._id}>
                <ListItem
                  button
                  selected={isActive}
                  onClick={() => onSelect(conversation._id)}
                  sx={{
                    p: 2,
                    bgcolor: isActive ? 'action.selected' : 'inherit'
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        isOnline && (
                          <FiberManualRecordIcon
                            fontSize="small"
                            sx={{ color: 'success.main', width: 10, height: 10 }}
                          />
                        )
                      }
                    >
                      <Avatar
                        alt={conversation.participant?.username || 'Utilisateur'}
                        src={conversation.participant?.photo}
                      />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography
                          variant="subtitle1"
                          fontWeight={conversation.unreadCount > 0 ? 'bold' : 'normal'}
                        >
                          {conversation.participant?.username || 'Utilisateur'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeTime(conversation.lastMessage?.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography
                          variant="body2"
                          fontWeight={conversation.unreadCount > 0 ? 'bold' : 'normal'}
                          color="text.secondary"
                          sx={{ maxWidth: '80%' }}
                        >
                          {truncateText(conversation.lastMessage?.content)}
                        </Typography>
                        {conversation.unreadCount > 0 && (
                          <Badge
                            badgeContent={conversation.unreadCount}
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default ConversationList; 