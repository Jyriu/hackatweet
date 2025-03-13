import React, { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import MessageInput from './MessageInput';

const ConversationDetails = ({
  conversation,
  currentUser,
  onSendMessage,
  onBack,
  isUserOnline,
  markMessageRead,
}) => {
  const messagesEndRef = useRef(null);

  // Faire défiler vers le bas pour voir les derniers messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages]);

  // Marquer les messages comme lus
  useEffect(() => {
    if (conversation?.messages) {
      conversation.messages.forEach(message => {
        if (!message.read && message.sender !== currentUser.id) {
          markMessageRead(message._id);
        }
      });
    }
  }, [conversation?.messages, currentUser.id, markMessageRead]);

  // Formater la date relative (ex: "il y a 2 heures")
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: fr
    });
  };

  if (!conversation) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  const { participant, messages = [] } = conversation;
  const isOnline = isUserOnline(participant?._id);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header avec infos du participant */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0' 
        }}
      >
        {onBack && (
          <IconButton onClick={onBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Avatar
          alt={participant?.username || 'Utilisateur'}
          src={participant?.photo}
          sx={{ width: 40, height: 40, mr: 2 }}
        />
        <Box>
          <Typography variant="subtitle1">
            {participant?.username || 'Utilisateur'}
          </Typography>
          <Box display="flex" alignItems="center">
            {isOnline && isOnline(participant?._id) ? (
              <>
                <FiberManualRecordIcon 
                  sx={{ color: 'success.main', width: 10, height: 10, mr: 0.5 }} 
                />
                <Typography variant="caption" color="text.secondary">
                  En ligne
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Hors ligne
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Zone de messages */}
      <List 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          bgcolor: '#f5f8fa', 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column'
        }}
      >
        {messages.length === 0 ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="100%"
          >
            <Typography variant="body1" color="text.secondary">
              Aucun message. Commencez la conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => {
            const isFromCurrentUser = message.sender === currentUser.id;
            const showDate = index === 0 || 
              new Date(message.createdAt).getDate() !== new Date(messages[index - 1].createdAt).getDate();
            
            return (
              <React.Fragment key={message._id || index}>
                {showDate && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      my: 2 
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        bgcolor: 'rgba(0,0,0,0.1)', 
                        px: 2, 
                        py: 0.5, 
                        borderRadius: 10 
                      }}
                    >
                      {new Date(message.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
                <ListItem 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: isFromCurrentUser ? 'flex-end' : 'flex-start',
                    px: 1,
                    py: 0.5
                  }}
                >
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      maxWidth: '70%',
                      bgcolor: isFromCurrentUser ? 'primary.light' : 'white',
                      color: isFromCurrentUser ? 'white' : 'inherit',
                      borderRadius: 2,
                      borderTopLeftRadius: !isFromCurrentUser ? 0 : 2,
                      borderTopRightRadius: isFromCurrentUser ? 0 : 2,
                    }}
                  >
                    <Typography variant="body1">
                      {message.content}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      display="block" 
                      textAlign="right"
                      color={isFromCurrentUser ? 'rgba(255,255,255,0.7)' : 'text.secondary'}
                      sx={{ mt: 1 }}
                    >
                      {formatRelativeTime(message.createdAt)}
                    </Typography>
                  </Paper>
                </ListItem>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </List>
      
      <Divider />
      
      {/* Zone de saisie de message */}
      <Box sx={{ p: 2 }}>
        <MessageInput onSendMessage={onSendMessage} />
      </Box>
    </Box>
  );
};

export default ConversationDetails; 