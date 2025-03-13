import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  CircularProgress,
  Box,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

const NewConversationModal = ({ open, onClose, onCreateConversation }) => {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Réinitialiser le state quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setError(null);
    }
  }, [open]);

  // Recherche d'utilisateurs
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/search/users?q=${searchQuery}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      // Filtrer l'utilisateur actuel et les utilisateurs déjà sélectionnés
      const filteredResults = response.data.filter(u => 
        u._id !== user.id && !selectedUsers.some(selected => selected._id === u._id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error);
      setError('Impossible de rechercher des utilisateurs. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Effectuer la recherche lors de la frappe
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleSelectUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter(u => u._id !== user._id));
    setSearchQuery('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const handleStartConversation = async () => {
    if (selectedUsers.length === 0) {
      setError('Veuillez sélectionner au moins un utilisateur.');
      return;
    }

    try {
      setLoading(true);
      // Pour l'instant, gérons seulement les conversations à deux participants
      const recipientId = selectedUsers[0]._id;
      
      // Utiliser la fonction onCreateConversation passée en props
      await onCreateConversation(recipientId);
      
      // Fermer le modal
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      setError('Impossible de créer la conversation. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Nouvelle conversation
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {/* Utilisateurs sélectionnés */}
        {selectedUsers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Destinataires :
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {selectedUsers.map(user => (
                <Box
                  key={user._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'primary.light',
                    color: 'white',
                    borderRadius: 4,
                    px: 1,
                    py: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {user.username}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveUser(user._id)}
                    sx={{ 
                      color: 'white', 
                      p: 0.5,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}
        
        {/* Champ de recherche */}
        <TextField
          autoFocus
          margin="dense"
          fullWidth
          label="Rechercher un utilisateur"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        
        {/* Résultats de recherche */}
        <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress size={24} />
            </Box>
          ) : searchResults.length > 0 ? (
            <List>
              {searchResults.map(user => (
                <ListItem 
                  key={user._id} 
                  button 
                  onClick={() => handleSelectUser(user)}
                >
                  <ListItemAvatar>
                    <Avatar
                      alt={user.username}
                      src={user.photo}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username}
                    secondary={`${user.prenom || ''} ${user.nom || ''}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : searchQuery && !loading ? (
            <Typography variant="body2" color="text.secondary" sx={{ my: 2, textAlign: 'center' }}>
              Aucun utilisateur trouvé
            </Typography>
          ) : null}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Annuler
        </Button>
        <Button 
          onClick={handleStartConversation} 
          color="primary" 
          variant="contained"
          disabled={selectedUsers.length === 0 || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Démarrer la conversation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewConversationModal; 