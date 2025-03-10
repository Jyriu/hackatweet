import React, { useState, useContext } from "react";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Snackbar,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { UserContext } from "../context/UserContext";

const NewTweet = ({ onAddTweet }) => {
  const { user } = useContext(UserContext);
  const [tweetContent, setTweetContent] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false); // Pour afficher la notification

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
    }
  };

  const handlePostTweet = () => {
    if (tweetContent.trim() === "") {
      setError("Le tweet ne peut pas être vide !");
      return;
    }

    const newTweet = {
      idTweet: Date.now(),
      contentxt: tweetContent,
      mediaUrl: image,
      auteur: user ? user.username : "Anonyme",
      userLikes: [],
      hashtags: [],
      date: new Date().toISOString(),
    };

    onAddTweet(newTweet);
    setTweetContent("");
    setImage(null);
    setError("");
    setOpen(true); // Afficher la notification
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*",
  });

  return (
    <Card sx={{ marginBottom: 2, padding: 2 }}>
      <CardContent>
        <Typography variant="h6" color="primary">
          Publier un Tweet
        </Typography>
        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}

        {user ? (
          <Typography variant="body2">
            Connecté en tant que <b>{user.username}</b>
          </Typography>
        ) : (
          <Typography color="error">Veuillez vous connecter</Typography>
        )}

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

        {/* Zone d'upload d'image */}
        <div
          {...getRootProps()}
          style={{
            border: "2px dashed #ccc",
            borderRadius: "10px",
            padding: "10px",
            textAlign: "center",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          <input {...getInputProps()} />
          <Typography variant="body2" color="textSecondary">
            Glisser-déposer une image ou cliquez pour en sélectionner une.
          </Typography>
        </div>

        {/* Aperçu de l'image uploadée */}
        {image && (
          <div style={{ marginTop: "10px", textAlign: "center" }}>
            <img
              src={image}
              alt="Aperçu"
              style={{ maxWidth: "100%", borderRadius: "10px" }}
            />
          </div>
        )}

        {/* Bouton pour publier le tweet */}
        <Button
          variant="contained"
          color="primary"
          sx={{ marginTop: 2 }}
          onClick={handlePostTweet}
          fullWidth
          disabled={!user}
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
