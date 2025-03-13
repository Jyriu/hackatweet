import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  InputAdornment,
  Paper
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    // Envoyer le message avec Entrée, mais pas avec Shift+Entrée (nouvelle ligne)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={{
        p: 1,
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: 2,
      }}
    >
      <IconButton color="primary" aria-label="joindre un fichier" component="span" sx={{ mx: 0.5 }}>
        <AttachFileIcon />
      </IconButton>
      
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Écrivez votre message..."
        variant="standard"
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        InputProps={{
          disableUnderline: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton color="primary" aria-label="ajouter un emoji" component="span">
                <EmojiEmotionsIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ mx: 1 }}
      />
      
      <IconButton 
        color="primary" 
        aria-label="envoyer" 
        onClick={handleSubmit}
        disabled={message.trim() === ''}
        sx={{ mx: 0.5 }}
      >
        <SendIcon />
      </IconButton>
    </Paper>
  );
};

export default MessageInput; 