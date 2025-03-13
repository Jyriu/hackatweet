import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Tooltip, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import MicIcon from '@mui/icons-material/Mic';

const MessageInput = ({ 
  onSendMessage, 
  onTyping,
  conversationId,
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Nettoyer le timeout lorsque le composant est démonté
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = () => {
    // Signaler qu'on est en train de taper
    if (onTyping && conversationId) {
      onTyping(conversationId, true);
      
      // Nettoyer le timeout précédent s'il existe
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Signaler qu'on a arrêté de taper après 3 secondes d'inactivité
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(conversationId, false);
      }, 3000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && onSendMessage) {
      onSendMessage(message);
      setMessage('');
      
      // Arrêter l'indication de saisie quand on envoie le message
      if (onTyping && conversationId) {
        onTyping(conversationId, false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    }
  };
  
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Pour l'instant, nous ne gérons pas réellement l'upload des fichiers
    // Mais nous pourrions implémenter cette fonctionnalité plus tard
    alert(`La fonctionnalité d'envoi de fichiers sera disponible prochainement. Fichier sélectionné: ${file.name}`);
    
    // Réinitialiser l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        position: 'relative' 
      }}>
        <input
          type="file"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx"
        />
        
        <Tooltip title="Joindre un fichier (bientôt disponible)">
          <span>
            <IconButton 
              color="primary" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={disabled || isUploading}
            >
              {isUploading ? <CircularProgress size={24} /> : <AttachFileIcon />}
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Insérer un emoji (bientôt disponible)">
          <span>
            <IconButton 
              color="primary" 
              disabled={disabled}
            >
              <InsertEmoticonIcon />
            </IconButton>
          </span>
        </Tooltip>
        
        <TextField
          fullWidth
          placeholder="Écrivez votre message ici..."
          variant="outlined"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          disabled={disabled}
          sx={{ 
            mx: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 4
            }
          }}
        />
        
        <Tooltip title={message.trim() ? "Envoyer" : "Enregistrer un message vocal (bientôt disponible)"}>
          <span>
            <IconButton 
              color="primary" 
              type={message.trim() ? "submit" : "button"} 
              disabled={disabled || (message.trim() === '' && !isUploading)}
            >
              {message.trim() ? <SendIcon /> : <MicIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default MessageInput; 