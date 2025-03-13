import React, { useState } from "react";
import { TextField, Button, Card, CardContent, Typography, Alert, Snackbar } from "@mui/material";

const NewTweet = ({ onAddTweet }) => {
  const [tweetContent, setTweetContent] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false); // Pour afficher la notification

  const handlePostTweet = () => {
    if (tweetContent.trim() === "") {
      setError("Le tweet ne peut pas être vide !");
      return;
    }

    const newTweet = {
      content: tweetContent,
      date: new Date().toISOString(),
    };

    onAddTweet(newTweet);
    setTweetContent("");
    setError("");
    setOpen(true); // Afficher la notification
  };

  return (
    <Card sx={{ marginBottom: 2, padding: 2 }}>
      <CardContent>
        <Typography variant="h6" color="primary">Publier un Tweet</Typography>
        {error && <Alert severity="error" sx={{ marginBottom: 2 }}>{error}</Alert>}
        
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Quoi de neuf ?"
          variant="outlined"
          value={tweetContent}
          onChange={(e) => setTweetContent(e.target.value)}
          sx={{ marginTop: 2 }}
        />

        {/* Bouton pour publier le tweet */}
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ marginTop: 2 }} 
          onClick={handlePostTweet}
          fullWidth
        >
          Tweeter
        </Button>

        {/* Notification "Tweet posté avec succès" */}
        <Snackbar
          open={open}
          autoHideDuration={2000}
          onClose={() => setOpen(false)}
          message="Tweet posté avec succès !"
        />
      </CardContent>
    </Card>
  );
};

export default NewTweet;