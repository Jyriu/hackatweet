<<<<<<< HEAD
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
          const response = await axios.get(
            `${url}/api/tweet/gettweet/${tweet.originalTweet}`
          );
          
          console.log("Réponse de l'API pour le tweet original:", response.data); // Affiche la réponse complète de l'API
          
          if (response.data && response.data.text) {
            setOriginalTweetText(response.data.text);
          } else {
            console.error("Le texte du tweet original n'a pas été trouvé");
          }
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
=======
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, Typography, Button, IconButton, TextField, Avatar, Box, Chip } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RepeatIcon from "@mui/icons-material/Repeat";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useTweets } from "../hooks/useTweets";
import { useAuth } from "../hooks/useAuth";
import { useInView } from "react-intersection-observer";

const Tweet = ({ tweet, onInView }) => {
  const { likeTweet, retweetTweet } = useTweets();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Configurer IntersectionObserver pour détecter quand le tweet est visible
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  });

  // Notifier le parent quand le tweet est en vue
  useEffect(() => {
    if (inView && onInView) {
      onInView();
    }
  }, [inView, onInView]);

  // Vérifier si l'utilisateur actuel a aimé ce tweet
  useEffect(() => {
    if (user && tweet.likes) {
      setLiked(tweet.likes.includes(user._id));
    }
    if (user && tweet.retweets) {
      setRetweeted(tweet.retweets.includes(user._id));
    }
  }, [user, tweet]);

  const handleLike = useCallback(async () => {
    if (!user) return;
    
    try {
      await likeTweet(tweet._id);
      setLiked(!liked);
    } catch (error) {
      console.error("Erreur lors du like:", error);
    }
  }, [user, tweet._id, liked, likeTweet]);

  const handleRetweet = useCallback(async () => {
    if (!user) return;
    
    try {
      await retweetTweet(tweet._id);
      setRetweeted(!retweeted);
    } catch (error) {
      console.error("Erreur lors du retweet:", error);
    }
  }, [user, tweet._id, retweeted, retweetTweet]);

  const handleAddComment = () => {
    if (newComment.trim() !== "") {
      setComments([...comments, { text: newComment, user: user?.username || 'Anonyme' }]);
      setNewComment("");
>>>>>>> sami
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
<<<<<<< HEAD
    <Card sx={{ marginBottom: 2, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6">{tweet._id}</Typography>
        <Typography variant="body1">{tweet.text}</Typography>
        {tweet.mediaUrl && (
          <Box sx={{ marginTop: 2 }}>
            <img
              src={tweet.mediaUrl}
              alt="Tweet media"
              style={{ maxWidth: "100%", borderRadius: "10px" }}
            />
          </Box>
        )}
        
          {/* <Typography>{likes}</Typography> */}

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
=======
    <Card sx={{ marginBottom: 2, padding: 2 }} ref={ref}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <Avatar 
            src={tweet.author?.avatar} 
            sx={{ marginRight: 1 }}
          >
            {tweet.author?.username?.charAt(0).toUpperCase() || "A"}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {tweet.author?.username || "Anonyme"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(tweet.date)}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" py={1}>{tweet.text}</Typography>
        
        {tweet.hashtags && tweet.hashtags.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
            {tweet.hashtags.map((tag, index) => (
              <Chip 
                key={index} 
                label={`#${tag}`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            ))}
          </Box>
        )}
        
        {tweet.mediaUrl && (
          <Box mt={1} mb={1}>
            <img 
              src={tweet.mediaUrl} 
              alt="Tweet media" 
              style={{ 
                width: "100%", 
                borderRadius: "10px", 
                maxHeight: "300px", 
                objectFit: "cover" 
              }} 
            />
          </Box>
        )}

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Box display="flex" alignItems="center">
            <IconButton 
              onClick={handleLike} 
              color={liked ? "error" : "default"}
              disabled={!user}
            >
              <FavoriteIcon />
            </IconButton>
            <Typography>{tweet.likes?.length || 0}</Typography>
          </Box>

          <Box display="flex" alignItems="center">
            <IconButton 
              onClick={handleRetweet} 
              color={retweeted ? "success" : "default"}
              disabled={!user}
            >
              <RepeatIcon />
            </IconButton>
            <Typography>{tweet.retweets?.length || 0}</Typography>
          </Box>

          <Box display="flex" alignItems="center">
            <IconButton 
              onClick={() => setShowComments(!showComments)} 
              color="primary"
            >
              <ChatBubbleOutlineIcon />
            </IconButton>
            <Typography>{comments.length}</Typography>
          </Box>
        </Box>

        {showComments && (
          <Box mt={2}>
            {comments.map((comment, index) => (
              <Box key={index} sx={{ backgroundColor: "#f5f5f5", p: 1, borderRadius: "5px", mb: 1 }}>
                <Typography variant="subtitle2">{comment.user}</Typography>
                <Typography variant="body2">{comment.text}</Typography>
              </Box>
            ))}
            
            {user ? (
              <>
                <TextField
                  fullWidth
                  label="Écrire un commentaire..."
                  variant="outlined"
                  size="small"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{ mt: 1 }}
                />
                <Button 
                  variant="contained" 
                  sx={{ mt: 1 }} 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Commenter
                </Button>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" mt={1}>
                Connectez-vous pour commenter
              </Typography>
            )}
          </Box>
>>>>>>> sami
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


