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


