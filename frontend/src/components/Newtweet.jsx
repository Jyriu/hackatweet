import React, { useState } from "react";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Snackbar,
  IconButton,
  Box,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import axios from "axios";

const NewTweet = ({ onAddTweet }) => {
  const [tweetContent, setTweetContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const handleMediaUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleLinkInput = () => {
    const inputLink = prompt("Enter a link:");
    if (inputLink) {
      setLink(inputLink);
    }
  };

  const handlePostTweet = async () => {
    if (tweetContent.trim() === "") {
      setError("Le tweet ne peut pas être vide !");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", tweetContent);
      if (selectedFile) {
        formData.append("media", selectedFile);
      }
      
      if (link) {
        formData.append("link", link);
      }

      const hashtags = tweetContent.match(/#\w+/g) || [];
      const mentions = tweetContent.match(/@\w+/g) || [];
      
      formData.append("hashtags", JSON.stringify(hashtags.map(tag => tag.slice(1))));
      formData.append("mentions", JSON.stringify(mentions.map(mention => mention.slice(1))));

      const response = await axios.post("http://localhost:5001/api/tweet/tweets", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      onAddTweet(response.data);
      
      setTweetContent("");
      setSelectedFile(null);
      setPreviewUrl("");
      setLink("");
      setError("");
      setOpen(true);
      
    } catch (error) {
      console.error("Error creating tweet:", error);
      setError("Failed to post tweet. Please try again.");
    }
  };

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

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Quoi de neuf ?"
          variant="outlined"
          value={tweetContent}
          onChange={(e) => setTweetContent(e.target.value)}
          sx={{ marginTop: 2 }}
          placeholder="Utilisez # pour les hashtags et @ pour mentionner des utilisateurs"
        />

        <Box sx={{ display: "flex", gap: 1, marginTop: 2 }}>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="media-upload"
            type="file"
            onChange={handleMediaUpload}
          />
          <label htmlFor="media-upload">
            <IconButton color="primary" component="span">
              <AddPhotoAlternateIcon />
            </IconButton>
          </label>

          <IconButton color="primary" onClick={handleLinkInput}>
            <InsertLinkIcon />
          </IconButton>
        </Box>

        {previewUrl && (
          <Box sx={{ marginTop: 2 }}>
            <img
              src={previewUrl}
              alt="Media Preview"
              style={{ maxWidth: "100%", borderRadius: "8px" }}
            />
          </Box>
        )}

        {link && (
          <Box sx={{ marginTop: 2 }}>
            <Typography variant="body2">
              Link added: <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
            </Typography>
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          sx={{ marginTop: 2 }}
          onClick={handlePostTweet}
          fullWidth
        >
          Tweeter
        </Button>

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
