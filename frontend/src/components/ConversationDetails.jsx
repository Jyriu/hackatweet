import React, { useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Paper,
  List,
  ListItem,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ReplayIcon from '@mui/icons-material/Replay';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import MessageInput from './MessageInput';

// Composant pour afficher le statut du message
const MessageStatus = ({ status, message, onRetry }) => {
  switch(status) {
    case 'sending':
      return (
        <Tooltip title="Envoi en cours">
          <ScheduleIcon fontSize="small" sx={{ opacity: 0.7, ml: 0.5 }} />
        </Tooltip>
      );
    case 'sent':
      return (
        <Tooltip title="Envoyé">
          <CheckIcon fontSize="small" sx={{ opacity: 0.7, ml: 0.5 }} />
        </Tooltip>
      );
    case 'delivered':
      return (
        <Tooltip title="Reçu">
          <DoneAllIcon fontSize="small" sx={{ opacity: 0.7, ml: 0.5 }} />
        </Tooltip>
      );
    case 'read':
      return (
        <Tooltip title="Lu">
          <DoneAllIcon fontSize="small" sx={{ opacity: 0.7, ml: 0.5, color: 'primary.main' }} />
        </Tooltip>
      );
    case 'failed':
      return (
        <Tooltip title="Cliquez pour réessayer">
          <IconButton 
            size="small" 
            color="error" 
            sx={{ ml: 0.5, p: 0 }}
            onClick={() => onRetry && onRetry(message)}
          >
            <Badge 
              badgeContent={<ReplayIcon fontSize="small" sx={{ width: 12, height: 12 }} />}
              color="primary"
              overlap="circular"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
            >
              <ErrorOutlineIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>
      );
    default:
      return null;
  }
};

// Composant pour afficher le message
const MessageItem = ({ message, isFromCurrentUser, showDate, dateLabel, formatRelativeTime, onRetry }) => {
  return (
    <React.Fragment>
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
            {dateLabel}
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
            opacity: message.isTempMessage ? 0.8 : 1
          }}
        >
          <Typography variant="body1">
            {message.content}
          </Typography>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              alignItems: 'center', 
              mt: 1
            }}
          >
            <Typography 
              variant="caption" 
              color={isFromCurrentUser ? 'rgba(255,255,255,0.7)' : 'text.secondary'}
            >
              {formatRelativeTime(message.createdAt)}
            </Typography>
            
            {isFromCurrentUser && (
              <MessageStatus 
                status={message.status} 
                message={message} 
                onRetry={onRetry}
              />
            )}
          </Box>
        </Paper>
      </ListItem>
    </React.Fragment>
  );
};

const ConversationDetails = ({
  conversation,
  currentUser: userProp,
  onSendMessage,
  onBack,
  isUserOnline,
  markMessageRead,
  indicateTyping,
  typingUsers = [],
  onRetryMessage
}) => {
  const messagesEndRef = useRef(null);
  
  // Normaliser l'utilisateur (peut être imbriqué ou direct)
  const normalizeUser = (userObj) => {
    if (!userObj) return null;
    
    // Si userObj a une propriété user, c'est une structure imbriquée
    if (userObj.user && typeof userObj.user === 'object') {
      console.log('📋 Structure utilisateur imbriquée détectée dans ConversationDetails, normalisation');
      return userObj.user;
    }
    
    // Sinon c'est déjà l'utilisateur direct
    return userObj;
  };
  
  // Normaliser l'utilisateur passé en prop
  const currentUser = useMemo(() => normalizeUser(userProp), [userProp]);
  
  // Logs de débogage
  console.log('🔍 ConversationDetails:', { 
    conversationId: conversation?._id,
    messagesCount: conversation?.messages?.length,
    currentUserId: currentUser?._id,
    typingUsers
  });

  useEffect(() => {
    // Log pour vérifier la propriété isFromCurrentUser des messages
    if (conversation?.messages) {
      conversation.messages.forEach(msg => {
        if (!msg.isFromCurrentUser) {
          console.log(`Message ${msg._id} - Non courant:`, {
            isFromCurrentUser: msg.isFromCurrentUser,
            sender: msg.sender,
            currentUserId: currentUser?._id,
            content: msg.content.substring(0, 15) + '...'
          });
        }
      });
    }
  }, [conversation?.messages, currentUser]);

  // Trier les messages par date et filtrer les doublons
  const sortedMessages = useMemo(() => {
    if (!conversation?.messages || !Array.isArray(conversation.messages)) {
      console.log('⚠️ Pas de messages dans la conversation ou format invalide');
      return [];
    }

    // Log pour le débogage
    console.log('🗂️ Messages bruts dans la conversation:', conversation.messages);

    // Vérifier l'existence des propriétés nécessaires
    conversation.messages.forEach((msg, index) => {
      if (!msg.content) {
        console.warn(`⚠️ Message ${index} sans contenu:`, msg);
      }
      if (msg.isFromCurrentUser === undefined) {
        console.warn(`⚠️ Message ${index} sans propriété isFromCurrentUser:`, msg);
      }
    });

    // Map pour garder seulement le dernier message avec un ID donné
    const uniqueMessages = new Map();
    
    // Trier par date (ancien -> récent)
    const sorted = [...conversation.messages].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA - dateB;
    });
    
    // Éliminer les doublons en conservant la dernière version
    sorted.forEach(msg => {
      // Utiliser l'ID permanent si disponible, sinon l'ID temporaire
      const messageId = msg._id || msg._tempId;
      if (messageId) {
        uniqueMessages.set(messageId, msg);
      } else {
        // Pour les messages sans ID, les conserver tous
        uniqueMessages.set(`temp-${Date.now()}-${Math.random()}`, msg);
      }
    });
    
    // Convertir la Map en tableau
    const messagesArray = Array.from(uniqueMessages.values());
    
    console.log(`📊 Messages triés: ${messagesArray.length} uniques sur ${conversation.messages.length} totaux`);
    
    // Résumé de débogage
    console.log('💬 Résumé des messages:');
    messagesArray.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${(msg._id || 'temp-id').substring(0, 6)}... - ${msg.isFromCurrentUser ? 'ENVOYÉ' : 'REÇU'} - "${msg.content.substring(0, 20)}${msg.content.length > 20 ? '...' : ''}"`);
    });
    
    return messagesArray;
  }, [conversation?.messages]);

  // Faire défiler vers le bas pour voir les derniers messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sortedMessages.length]);

  // Marquer les messages comme lus
  useEffect(() => {
    if (conversation?.messages) {
      conversation.messages.forEach(message => {
        // Vérifier si le message n'est pas du currentUser et n'est pas déjà lu
        if (!message.isFromCurrentUser && !message.read) {
          console.log('Marquer comme lu:', message);
          markMessageRead(message._id);
        }
      });
    }
  }, [conversation?.messages, markMessageRead]);

  // Formater la date relative (ex: "il y a 2 heures")
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: fr
    });
  };

  // Gérer la tentative de renvoi d'un message en échec
  const handleRetryMessage = (message) => {
    console.log('Tentative de renvoi du message:', message);
    if (onRetryMessage && message) {
      onRetryMessage(message);
    }
  };

  if (!conversation) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  const { participant } = conversation;
  
  // Logs de débogage
  console.log('Messages à afficher:', sortedMessages);
  
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
            {participant && isUserOnline && (() => {
              const userOnlineStatus = isUserOnline(participant._id);
              console.log(`🟢 Statut en ligne pour ${participant.username || 'utilisateur'} (${participant._id}): ${userOnlineStatus}`);
              return userOnlineStatus;
            })() ? (
              <>
                <FiberManualRecordIcon 
                  sx={{ color: 'success.main', width: 10, height: 10, mr: 0.5 }} 
                />
                <Typography variant="caption" color="text.secondary">
                  En ligne
                </Typography>
              </>
            ) : (
              <>
                <FiberManualRecordIcon 
                  sx={{ color: 'text.disabled', width: 10, height: 10, mr: 0.5 }} 
                />
                <Typography variant="caption" color="text.secondary">
                  Hors ligne
                </Typography>
              </>
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
        {sortedMessages.length === 0 ? (
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
          sortedMessages.map((message, index) => {
            // Utiliser explicitement la propriété isFromCurrentUser
            const isFromCurrentUser = message.isFromCurrentUser === true;
            
            const showDate = index === 0 || 
              new Date(message.createdAt).getDate() !== new Date(sortedMessages[index - 1].createdAt).getDate();
            
            const dateLabel = new Date(message.createdAt).toLocaleDateString();
            
            return (
              <MessageItem 
                key={message._id || index}
                message={message}
                isFromCurrentUser={isFromCurrentUser}
                showDate={showDate}
                dateLabel={dateLabel}
                formatRelativeTime={formatRelativeTime}
                onRetry={handleRetryMessage}
              />
            );
          })
        )}
        
        {/* Indicateur de saisie */}
        {typingUsers && typingUsers.length > 0 && (
          <Box sx={{ p: 1, mt: 1 }}>
            <Paper
              elevation={1}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                borderRadius: 2,
                backgroundColor: 'background.paper',
                maxWidth: '70%'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      backgroundColor: 'primary.main',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite',
                      mr: 0.5
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      backgroundColor: 'primary.main',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite',
                      animationDelay: '0.2s',
                      mr: 0.5
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      backgroundColor: 'primary.main',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite',
                      animationDelay: '0.4s'
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {typingUsers.length === 1
                    ? `${typingUsers[0].username || 'Utilisateur'} est en train d'écrire...`
                    : 'Plusieurs personnes écrivent...'}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </List>
      
      <Divider />
      
      {/* Zone de saisie de message */}
      <Box sx={{ p: 2 }}>
        <MessageInput 
          onSendMessage={onSendMessage}
          onTyping={indicateTyping}
          conversationId={conversation._id}
        />
      </Box>
    </Box>
  );
};

export default ConversationDetails; 