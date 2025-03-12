// Tweet.js
import React, { useState } from "react";
import { Card, CardContent, Typography, Button, IconButton, TextField, Avatar, Box } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RepeatIcon from "@mui/icons-material/Repeat";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import RetweetDialog from "./RetweetDialog";
import { likeTweet } from "../services/api"; // Import the API function
import { Link } from "react-router-dom";
import { useUserInfo } from "../hooks/useUserInfo"; // Nouveau hook

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const Tweet = ({ tweet, onUpdateTweet, onRetweet }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.userLikes ? tweet.userLikes.length : 0);
  const [retweeted, setRetweeted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [openRetweetDialog, setOpenRetweetDialog] = useState(false);

  // Si la photo n'est pas présente, utiliser le hook pour obtenir les infos complètes de l'auteur
  const { userInfo } = useUserInfo(tweet.author.username);
  const authorPhoto = tweet.author.photo || (userInfo && userInfo.photo);

  const retweetCount = tweet.retweets ? tweet.retweets.length : 0;

  useEffect(() => {
    const currentUserId = localStorage.getItem("userId");
    setLiked(tweet.userLikes.includes(currentUserId));
  }, [tweet.userLikes]);

  const handleLike = async () => {
    try {
      const response = await likeTweet(tweet._id);
      setLiked(!liked);
      setLikeCount(response.tweet.userLikes.length);
      onUpdateTweet(response.tweet);
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  };

  const handleRetweet = () => {
    setOpenRetweetDialog(true);
  };

  const handleCloseRetweetDialog = () => {
    setOpenRetweetDialog(false);
  };

  const handleRetweetSubmit = (newRetweet) => {
    setRetweeted(true);
    onRetweet(newRetweet);
  };

  const handleAddComment = () => {
    if (newComment.trim() !== "") {
      setComments([...comments, newComment]);
      setNewComment("");
      // TODO: Implement comment functionality with backend
    }
  };

  return (
    <Card sx={{ marginBottom: 2, padding: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Link
            to={`/user/${tweet.author.username}`}
            style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}
          >
            <Avatar
              src={
                authorPhoto
                  ? `${API_URL}${authorPhoto}`
                  : "https://via.placeholder.com/150?text=Avatar"
              }
              alt={tweet.author.username}
            />
            <Typography variant="subtitle1" sx={{ ml: 1 }}>
              {tweet.author.username}
            </Typography>
          </Link>
        </Box>

        <Typography variant="body1">{tweet.text}</Typography>

        {tweet.hashtags && (
          <Box sx={{ marginTop: "8px" }}>{renderHashtags(tweet.hashtags)}</Box>
        )}

        {tweet.link && (
          <Typography
            variant="body2"
            color="primary"
            sx={{ marginTop: "8px", wordWrap: "break-word" }}
          >
            <a href={tweet.link} target="_blank" rel="noopener noreferrer">
              {tweet.link}
            </a>
          </Typography>
        )}

        {tweet.mediaUrl && (
          <img
            src={tweet.mediaUrl}
            alt="Tweet media"
            style={{ width: "100%", borderRadius: "10px", marginTop: "10px" }}
          />
        )}

        {tweet.originalTweet && renderOriginalTweet(tweet.originalTweet)}

        <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Badge badgeContent={likeCount} color="error">
            <IconButton onClick={handleLike} color={liked ? "error" : "default"}>
              <FavoriteIcon />
            </IconButton>
          </Badge>

          <Badge badgeContent={retweetCount} color="primary">
            <IconButton onClick={handleRetweet} color={retweeted ? "success" : "default"}>
              <RepeatIcon />
            </IconButton>
          </Badge>

          <IconButton onClick={() => setShowComments(!showComments)} color="primary">
            <ChatBubbleOutlineIcon />
          </IconButton>
        </Box>

        {showComments && (
          <Box mt={2}>
            {comments.map((comment, index) => (
              <Typography
                key={index}
                variant="body2"
                sx={{
                  backgroundColor: "#f5f5f5",
                  padding: "8px",
                  borderRadius: "5px",
                  marginBottom: "5px",
                }}
              >
                {comment}
              </Typography>
            ))}
            <TextField
              fullWidth
              label="Écrire un commentaire..."
              variant="outlined"
              size="small"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              sx={{ mt: 1 }}
            />
            <Button variant="contained" sx={{ mt: 1 }} onClick={handleAddComment}>
              Ajouter
            </Button>
          </Box>
        )}

        <RetweetDialog
          open={openRetweetDialog}
          onClose={handleCloseRetweetDialog}
          tweet={tweet}
          onRetweet={handleRetweetSubmit}
        />
      </CardContent>
    </Card>
  );
};

export default Tweet;
