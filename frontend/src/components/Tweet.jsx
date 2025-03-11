import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  ButtonGroup,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Button,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"; // Icône Like
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline"; // Icône Commenter
import RepeatIcon from "@mui/icons-material/Repeat"; // Icône Retweeter
import axios from "axios";

// Instanciation de l'URL du backend
const url = import.meta.env.VITE_BACKEND_URL;

const Tweet = ({ tweet }) => {
  const [showCommentField, setShowCommentField] = useState(false); // Afficher/masquer le champ de commentaire
  const [commentText, setCommentText] = useState(""); // Texte du commentaire
  const [comments, setComments] = useState([]); // Commentaires existants

  // Récupérer les commentaires depuis le backend
  const fetchComments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${url}/api/tweet/comments/${tweet._id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setComments(response.data); // Mettre à jour la liste des commentaires
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires:", error);
    }
  };

  // Charger les commentaires au montage du composant
  useEffect(() => {
    fetchComments();
  }, [tweet._id]);

  // Gestion des clics pour les boutons
  const handleLike = () => {
    console.log("Like tweet:", tweet._id);
    // Ajoutez ici la logique pour liker le tweet
  };

  const handleComment = () => {
    setShowCommentField(!showCommentField); // Afficher/masquer le champ de commentaire
  };

  const handleRetweet = () => {
    console.log("Retweeter le tweet:", tweet._id);
    // Ajoutez ici la logique pour retweeter le tweet
  };

  // Envoyer un commentaire
  const handleSubmitComment = async () => {
    if (commentText.trim() === "") return; // Ne pas envoyer de commentaire vide

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${url}/api/tweet/comment/${tweet._id}/`,
        { text: commentText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Ajouter le nouveau commentaire à la liste
      setComments([...comments, response.data]);
      setCommentText(""); // Réinitialiser le champ de texte
      setShowCommentField(false); // Masquer le champ de commentaire
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
    }
  };

  return (
    <Card sx={{ marginBottom: 2, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        {/* Texte du tweet */}
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {tweet.text}
        </Typography>

        {/* Image du tweet (si elle existe) */}
        {tweet.mediaUrl && (
          <Box sx={{ marginTop: 2 }}>
            <img
              src={tweet.mediaUrl}
              alt="Tweet media"
              style={{ maxWidth: "100%", borderRadius: "10px" }}
            />
          </Box>
        )}

        {/* Auteur et date du tweet */}
        <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
          Par {tweet.author.username} • {new Date(tweet.date).toLocaleString()}
        </Typography>

        {/* Boutons Like, Commenter, Retweeter */}
        <ButtonGroup sx={{ marginTop: 2 }}>
          <IconButton onClick={handleLike} aria-label="like" color="primary">
            <FavoriteBorderIcon />
          </IconButton>
          <IconButton onClick={handleComment} aria-label="commenter" color="primary">
            <ChatBubbleOutlineIcon />
          </IconButton>
          <IconButton onClick={handleRetweet} aria-label="retweeter" color="primary">
            <RepeatIcon />
          </IconButton>
        </ButtonGroup>

        {/* Champ de commentaire */}
        {showCommentField && (
          <Box sx={{ marginTop: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Ajouter un commentaire"
              variant="outlined"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ marginTop: 1 }}
              onClick={handleSubmitComment}
            >
              Envoyer
            </Button>
          </Box>
        )}

        {/* Liste des commentaires */}
        {comments.length > 0 && (
          <List sx={{ marginTop: 2 }}>
            {comments.map((comment) => (
              <ListItem key={comment._id} alignItems="flex-start">
                <Avatar sx={{ marginRight: 2 }}>{comment.author.username}</Avatar>
                <ListItemText
                  primary={comment.author.username}
                  secondary={
                    <>
                      <Typography variant="body2" color="text.primary">
                        {comment.text}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.date).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default Tweet;