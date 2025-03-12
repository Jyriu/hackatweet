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
  Snackbar,
  Alert,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import RepeatIcon from "@mui/icons-material/Repeat";
import axios from "axios";

const url = import.meta.env.VITE_BACKEND_URL;

const Tweet = ({ tweet }) => {
  const [showCommentField, setShowCommentField] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(tweet.comments || []);
  const [likesCount, setLikesCount] = useState(tweet.likes || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [retweetComment, setRetweetComment] = useState("");
  const [showRetweetField, setShowRetweetField] = useState(false);
  const [error, setError] = useState(null);
  const [originalTweetText, setOriginalTweetText] = useState(null); // Pour stocker le texte du tweet original

  useEffect(() => {
    // Si tweet.originalTweet existe, on effectue la requête pour récupérer le tweet original
    if (tweet.originalTweet) {
      const fetchOriginalTweet = async () => {
        try {
          const response = await axios.post(
            `${url}/api/tweet/getweet/${tweet.originalTweet}`
          );
          setOriginalTweetText(response.data.text);
        } catch (error) {
          console.error("Erreur lors de la récupération du tweet original:", error);
          setError("Erreur lors de la récupération du tweet original");
        }
      };

      fetchOriginalTweet();
    }
  }, [tweet.originalTweet]);

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

  const handleComment = () => {
    setShowCommentField(!showCommentField);
  };

  const handleSubmitComment = async () => {
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

  const handleRetweet = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${url}/api/tweet/retweet/${tweet._id}/`,
        { text: retweetComment || "" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Retweet réussi:", response.data);
      setRetweetComment(""); 
      setShowRetweetField(false);
    } catch (error) {
      console.error("Erreur lors du retweet:", error);
      setError("Erreur lors du retweet");
    }
  };

  return (
    <Card sx={{ marginBottom: 2, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {tweet.text}
        </Typography>

        {tweet.mediaUrl && (
          <Box sx={{ marginTop: 2 }}>
            <img
              src={tweet.mediaUrl}
              alt="Tweet media"
              style={{ maxWidth: "100%", borderRadius: "10px" }}
            />
          </Box>
        )}

        <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
          Par {tweet.author.username} • {new Date(tweet.date).toLocaleString()}
        </Typography>

        <ButtonGroup sx={{ marginTop: 2 }}>
          <IconButton onClick={handleLike} aria-label="like" color="primary" disabled={isLiking}>
            <FavoriteBorderIcon />
            <Typography variant="body2" sx={{ marginLeft: 1 }}>
              {likesCount}
            </Typography>
          </IconButton>
          <IconButton onClick={handleComment} aria-label="commenter" color="primary">
            <ChatBubbleOutlineIcon />
          </IconButton>
          <IconButton onClick={() => setShowRetweetField(!showRetweetField)} aria-label="retweeter" color="primary">
            <RepeatIcon />
          </IconButton>
        </ButtonGroup>

        {/* Afficher le tweet original si présent */}
        {originalTweetText && (
          <Box sx={{ marginTop: 2, paddingLeft: 2, borderLeft: "2px solid #ccc" }}>
            <Typography variant="body2" color="textSecondary">
              Tweet original :
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ marginTop: 1 }}>
              {originalTweetText}
            </Typography>
          </Box>
        )}

        {/* Champ de commentaire pour le retweet */}
        {showRetweetField && (
          <Box sx={{ marginTop: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Ajouter un commentaire pour le retweet (optionnel)"
              variant="outlined"
              value={retweetComment}
              onChange={(e) => setRetweetComment(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ marginTop: 1 }}
              onClick={handleRetweet}
            >
              Retweeter
            </Button>
          </Box>
        )}

        {/* Champ de commentaire principal */}
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

      {/* Affichage des erreurs */}
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
