import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RepeatIcon from "@mui/icons-material/Repeat";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import axios from "axios";

const url = import.meta.env.VITE_BACKEND_URL;

const Tweet = ({ tweet }) => {
  const [likesCount, setLikesCount] = useState(tweet.likes || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [comments, setComments] = useState([]);
  const [showCommentField, setShowCommentField] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isRetweeting, setIsRetweeting] = useState(false);
  const [retweetText, setRetweetText] = useState("");
  const [showRetweetField, setShowRetweetField] = useState(false);
  const [error, setError] = useState(null);
  const [originalTweet, setOriginalTweet] = useState(null); // Pour stocker le tweet original

  // Récupérer les commentaires
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`${url}/api/tweet/comments/${tweet._id}/`);
        setComments(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des commentaires:", error);
        setError("Erreur lors de la récupération des commentaires");
      }
    };

    fetchComments();
  }, [tweet._id]);

  // Récupérer le tweet original si tweet.originalTweet existe
  useEffect(() => {
    if (tweet.originalTweet) {
      const fetchOriginalTweet = async () => {
        try {
          const response = await axios.get(`${url}/api/tweet/gettweet/${tweet.originalTweet}`);
          setOriginalTweet(response.data); // Stocker le tweet original
        } catch (error) {
          console.error("Erreur lors de la récupération du tweet original:", error);
          setError("Erreur lors de la récupération du tweet original");
        }
      };

      fetchOriginalTweet();
    }
  }, [tweet.originalTweet]);

  // Gérer le like
  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${url}/api/tweet/like/${tweet._id}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLikesCount(response.data.tweet.userLikes.length);
    } catch (error) {
      console.error("Erreur lors du like du tweet:", error);
      setError("Erreur lors du like du tweet");
    } finally {
      setIsLiking(false);
    }
  };

  // Gérer le retweet
  const handleRetweet = async () => {
    if (isRetweeting) return;
    setIsRetweeting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${url}/api/tweet/retweet/${tweet._id}/`,
        { text: retweetText }, // Envoyer le texte du retweet
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRetweetText(""); // Réinitialiser le champ de texte
      setShowRetweetField(false); // Masquer le champ de texte après envoi
    } catch (error) {
      console.error("Erreur lors du retweet:", error);
      setError("Erreur lors du retweet");
    } finally {
      setIsRetweeting(false);
    }
  };

  // Gérer l'ajout d'un commentaire
  const handleAddComment = async () => {
    if (commentText.trim() === "") return;

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

      setComments([...comments, response.data]);
      setCommentText("");
      setShowCommentField(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      setError("Erreur lors de l'ajout du commentaire");
    }
  };

  return (
    <Card sx={{ marginBottom: 2, padding: 2 }}>
      <CardContent>
        <Typography variant="h6">{tweet.text}</Typography>
        {tweet.mediaUrl && (
          <img
            src={tweet.mediaUrl}
            alt="Tweet media"
            style={{ width: "100%", borderRadius: "10px", marginTop: "10px" }}
          />
        )}

        {/* Afficher le tweet original s'il existe */}
        {originalTweet && (
          <Box sx={{ marginTop: 2, padding: 2, borderLeft: "2px solid #ccc", backgroundColor: "#f9f9f9" }}>
            <Typography variant="body2" color="text.secondary">
              Tweet original :
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ marginTop: 1 }}>
              {originalTweet.text}
            </Typography>
            {originalTweet.mediaUrl && (
              <img
                src={originalTweet.mediaUrl}
                alt="Media du tweet original"
                style={{ width: "100%", borderRadius: "10px", marginTop: "10px" }}
              />
            )}
            <Typography variant="caption" color="text.secondary" sx={{ marginTop: 1 }}>
              Par {originalTweet.author.username} • {new Date(originalTweet.date).toLocaleString()}
            </Typography>
          </Box>
        )}

        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
          {/* Bouton Like */}
          <IconButton onClick={handleLike} color={isLiking ? "error" : "default"}>
            <FavoriteIcon />
            <Typography>{likesCount}</Typography>
          </IconButton>

          {/* Bouton Retweet */}
          <IconButton onClick={() => setShowRetweetField(!showRetweetField)} color={isRetweeting ? "success" : "default"}>
            <RepeatIcon />
          </IconButton>

          {/* Bouton Commentaire */}
          <IconButton onClick={() => setShowCommentField(!showCommentField)} color="primary">
            <ChatBubbleOutlineIcon />
            <Typography>{comments.length}</Typography>
          </IconButton>
        </div>

        {/* Champ de texte pour le retweet */}
        {showRetweetField && (
          <div style={{ marginTop: "10px" }}>
            <TextField
              fullWidth
              label="Ajouter un commentaire pour le retweet (optionnel)"
              variant="outlined"
              size="small"
              value={retweetText}
              onChange={(e) => setRetweetText(e.target.value)}
              sx={{ marginTop: 1 }}
            />
            <Button variant="contained" sx={{ marginTop: 1 }} onClick={handleRetweet}>
              Envoyer
            </Button>
          </div>
        )}

        {/* Champ de texte pour le commentaire */}
        {showCommentField && (
          <div style={{ marginTop: "10px" }}>
            <TextField
              fullWidth
              label="Écrire un commentaire..."
              variant="outlined"
              size="small"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              sx={{ marginTop: 1 }}
            />
            <Button variant="contained" sx={{ marginTop: 1 }} onClick={handleAddComment}>
              Ajouter
            </Button>
          </div>
        )}

        {/* Liste des commentaires */}
        {comments.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            {comments.map((comment) => (
              <div key={comment._id} style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "5px", marginBottom: "5px" }}>
                <Typography variant="body2" color="text.primary">
                  {comment.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Par {comment.author.username} • {new Date(comment.date).toLocaleString()}
                </Typography>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Gestion des erreurs */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default Tweet;