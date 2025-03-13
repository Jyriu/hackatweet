import React, { useState, useEffect, useMemo } from 'react';
import { Container, Grid, Paper, Typography, Box, useMediaQuery, useTheme, CircularProgress } from '@mui/material';
import { useMessages } from '../hooks/useMessages';
import { useConversation } from '../hooks/useConversation';
import { useAuth } from '../hooks/useAuth';
import ConversationList from '../components/ConversationList';
import ConversationDetails from '../components/ConversationDetails';
import NewConversationModal from '../components/NewConversationModal';

const Chat = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user: userFromAuth } = useAuth();
  
  // Normaliser l'utilisateur (peut être imbriqué ou direct)
  const normalizeUser = (userObj) => {
    if (!userObj) return null;
    
    // Si userObj a une propriété user, c'est une structure imbriquée
    if (userObj.user && typeof userObj.user === 'object') {
      console.log('📋 Structure utilisateur imbriquée détectée dans Chat, normalisation');
      return userObj.user;
    }
    
    // Sinon c'est déjà l'utilisateur direct
    return userObj;
  };
  
  // User normalisé (mémorisé pour éviter les rendus inutiles)
  const user = useMemo(() => normalizeUser(userFromAuth), [userFromAuth]);
  
  // Utiliser le hook useConversation pour la gestion des conversations
  const { 
    conversations, 
    activeConversation,
    activeConversationId,
    loading: conversationLoading, 
    error: conversationError,
    isFetchingMessages,
    setActiveConversation,
    createConversation,
    isUserOnline,
    refreshOnlineUsers
  } = useConversation();
  
  // Utiliser le hook useMessages seulement pour les fonctions liées aux messages
  const { 
    sendMessage,
    markMessageRead,
    indicateTyping,
    typingUsers,
    retryFailedMessage
  } = useMessages();

  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);

  // Sur mobile, ne montrer que la liste des conversations au début
  useEffect(() => {
    if (isMobile) {
      // Ne pas masquer la liste des conversations si on n'a pas de conversation active
      // ou si on est explicitement en mode liste
      setShowConversationList(!activeConversation || showConversationList);
    } else {
      // Toujours afficher la liste sur desktop, quelle que soit la conversation active
      setShowConversationList(true);
    }
  }, [isMobile, activeConversation, showConversationList]);

  const handleConversationSelect = (conversationId) => {
    // Éviter de recharger la même conversation
    if (conversationId !== activeConversationId) {
      console.log('Sélection de la conversation:', conversationId);
      setActiveConversation(conversationId);
    }
    
    if (isMobile) {
      // Sur mobile, cacher la liste des conversations lorsqu'on en sélectionne une
      setShowConversationList(false);
    }
  };

  const handleBackToList = () => {
    // Afficher la liste des conversations
    setShowConversationList(true);
    
    // Sur mobile, désélectionner la conversation active pour libérer l'espace
    if (isMobile) {
      setActiveConversation(null);
    }
  };

  const handleSendMessage = (content) => {
    if (activeConversation && content.trim()) {
      // Logs pour déboguer
      console.log('Conversation active:', activeConversation);
      
      // Utiliser l'ID de conversation et l'ID du participant
      const conversationId = activeConversation._id;
      const recipientId = activeConversation.participant?._id;
      
      console.log('Envoi du message à:', recipientId);
      console.log('Utilisateur actuel:', user);
      
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
                onRefreshOnlineUsers={refreshOnlineUsers}
              />
            </Grid>
          )}
          
          {(!isMobile || !showConversationList) && (
            <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {activeConversation ? (
                <>
                  {isFetchingMessages ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ConversationDetails 
                      conversation={activeConversation}
                      currentUser={user}
                      onSendMessage={handleSendMessage}
                      onBack={isMobile ? handleBackToList : null}
                      isUserOnline={isUserOnline}
                      markMessageRead={markMessageRead}
                      indicateTyping={indicateTyping}
                      typingUsers={typingUsers}
                      onRetryMessage={retryFailedMessage}
                    />
                  )}
                </>
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