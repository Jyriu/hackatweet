// RetweetDialog.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography
} from '@mui/material';

import { retweetTweet } from '../services/api';

const RetweetDialog = ({ open, onClose, tweet, onRetweet }) => {
  const [retweetContent, setRetweetContent] = useState('');

  const handleRetweetSubmit = async () => {
    try {
      const newRetweet = await retweetTweet(tweet._id, retweetContent, tweet.mediaUrl, tweet.hashtags);
      onRetweet(newRetweet);
      onClose();
    } catch (error) {
      console.error("Error retweeting:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Retweet</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Original Tweet: {tweet.text}
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          id="retweet-content"
          label="Add your comment (optional)"
          type="text"
          fullWidth
          variant="outlined"
          value={retweetContent}
          onChange={(e) => setRetweetContent(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleRetweetSubmit}>Retweet</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RetweetDialog;
