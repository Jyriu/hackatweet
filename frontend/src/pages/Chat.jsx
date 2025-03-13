import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, useMediaQuery, useTheme } from '@mui/material';
import { useMessages } from '../hooks/useMessages';
import { useConversation } from '../hooks/useConversation';
import { useAuth } from '../hooks/useAuth';
import ConversationList from '../components/ConversationList';
import ConversationDetails from '../components/ConversationDetails';
import NewConversationModal from '../components/NewConversationModal';

const Chat = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  // Utiliser le hook useConversation pour la gestion des conversations
  const { 
    conversations, 
    activeConversation,
    activeConversationId,
    loading: conversationLoading, 
    error: conversationError, 
    setActiveConversation,
    createConversation,
    isUserOnline
  } = useConversation();
  
  // Utiliser le hook useMessages seulement pour les fonctions liées aux messages
  const { 
    sendMessage,
    markMessageRead
  } = useMessages();

  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);

  // Sur mobile, ne montrer que la liste des conversations au début
  useEffect(() => {
    if (isMobile) {
      setShowConversationList(!activeConversation);
    } else {
      setShowConversationList(true);
    }
  }, [isMobile, activeConversation]);

  const handleConversationSelect = (conversationId) => {
    setActiveConversation(conversationId);
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  const handleBackToList = () => {
    setShowConversationList(true);
  };

  const handleSendMessage = (content) => {
    if (activeConversation && content.trim()) {
      // Logs pour déboguer
      console.log('Conversation active:', activeConversation);
      
      // Utiliser l'ID de conversation et l'ID du participant
      const conversationId = activeConversation._id;
      const recipientId = activeConversation.participant?._id;
      
      console.log('Envoi du message à:', recipientId);
      
      sendMessage(
        conversationId,
        content,
        recipientId
      );
    }
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleCloseModal = () => {
    setShowNewConversationModal(false);
  };

  if (!user) {
    return (
      <Container>
        <Typography variant="h5" sx={{ mt: 4 }}>
          Veuillez vous connecter pour accéder à la messagerie.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: 'calc(100vh - 80px)' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Messages
      </Typography>
      
      <Paper elevation={2} sx={{ 
        height: 'calc(100% - 50px)', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Grid container sx={{ height: '100%' }}>
          {showConversationList && (
            <Grid item xs={12} md={4} sx={{ 
              borderRight: '1px solid #e0e0e0',
              height: '100%'
            }}>
              <ConversationList 
                conversations={conversations} 
                activeConversationId={activeConversationId}
                onSelect={handleConversationSelect}
                onNewConversation={handleNewConversation}
                isUserOnline={isUserOnline}
                loading={conversationLoading}
                error={conversationError}
              />
            </Grid>
          )}
          
          {(!isMobile || !showConversationList) && (
            <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {activeConversation ? (
                <ConversationDetails 
                  conversation={activeConversation}
                  currentUser={user}
                  onSendMessage={handleSendMessage}
                  onBack={isMobile ? handleBackToList : null}
                  isUserOnline={isUserOnline}
                  markMessageRead={markMessageRead}
                />
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography variant="h6" color="text.secondary">
                    Sélectionnez une conversation ou commencez-en une nouvelle
                  </Typography>
                </Box>
              )}
            </Grid>
          )}
        </Grid>
      </Paper>
      
      <NewConversationModal 
        open={showNewConversationModal} 
        onClose={handleCloseModal}
        onCreateConversation={createConversation}
      />
    </Container>
  );
};

export default Chat; 