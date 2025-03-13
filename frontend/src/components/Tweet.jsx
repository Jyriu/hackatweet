import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Button, IconButton, TextField, Badge, Avatar, Box } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RepeatIcon from "@mui/icons-material/Repeat";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import RetweetDialog from "./RetweetDialog";
import { likeTweet, bookmarkTweet } from "../services/api";
import { Link } from "react-router-dom";

const Tweet = ({ tweet, user, onUpdateTweet, onRetweet }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet?.userLikes?.length || 0);
  const [retweeted, setRetweeted] = useState(false);
  const [localRetweetCount, setLocalRetweetCount] = useState(tweet?.retweets?.length || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(tweet?.usersave?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [openRetweetDialog, setOpenRetweetDialog] = useState(false);
  const currentUserId = user?.id;

  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
  useEffect(() => {
    setLiked(tweet?.userLikes?.includes(currentUserId));
    setIsBookmarked(tweet?.usersave?.includes(currentUserId));
  }, [tweet?.userLikes, tweet?.usersave, currentUserId]);

  const handleLike = async () => {
    try {
      const response = await likeTweet(tweet._id);
      setLiked(!liked);
      setLikeCount(response?.tweet?.userLikes?.length);
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
    setLocalRetweetCount(prevCount => prevCount + 1);
    onRetweet(newRetweet);
  };

  const handleBookmark = async () => {
    try {
      const response = await bookmarkTweet(tweet._id);
      setIsBookmarked(!isBookmarked);
      setBookmarkCount(response?.tweet?.usersave?.length);
      onUpdateTweet(response.tweet);
    } catch (error) {
      console.error("Error bookmarking tweet:", error);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim() !== "") {
      setComments([...comments, newComment]);
      setNewComment("");
      // TODO: Implement comment functionality with backend
    }
  };

  const renderHashtags = (hashtags) => {
    return hashtags.map((hashtag, index) => (
      <Typography
        key={index}
        variant="body2"
        color="primary"
        sx={{ display: "inline", marginRight: "8px" }}
      >
        #{hashtag}
      </Typography>
    ));
  };

  const renderOriginalTweet = (originalTweet) => {
    return (
      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "10px",
          marginTop: "16px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <Typography variant="subtitle2" color="textSecondary">
          Retweeted from @{originalTweet?.author?.username}
        </Typography>
        <Typography variant="body1" sx={{ marginTop: "8px" }}>
          {originalTweet.text}
        </Typography>
        {originalTweet.hashtags && (
          <Box sx={{ marginTop: "8px" }}>{renderHashtags(originalTweet.hashtags)}</Box>
        )}
        {originalTweet.link && (
          <Typography
            variant="body2"
            color="primary"
            sx={{ marginTop: "8px", wordWrap: "break-word" }}
          >
            <a href={originalTweet.link} target="_blank" rel="noopener noreferrer">
              {originalTweet.link}
            </a>
          </Typography>
        )}
        {originalTweet.mediaUrl && (
          <img
            src={`${API_URL}${originalTweet.mediaUrl}`}
            alt="Original Tweet Media"
            style={{ width: "100%", borderRadius: "8px", marginTop: "10px" }}
          />
        )}
      </Box>
    );
  };

  return (
    <Card sx={{ marginBottom: 2, padding: 2 }}>
      <CardContent>
        {/* Redirection sur la page utilisateur via Link */}
        <Link to={`/user/${tweet?.author?.username}`} style={{ textDecoration: "none", color: "inherit" }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar
              src={tweet?.author?.profilePicture || tweet?.author?.photo || "https://via.placeholder.com/150?text=Avatar"}
              alt={tweet?.author?.username}
            />
            <Box ml={2}>
              <Typography variant="subtitle1">{tweet?.author?.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                @{tweet?.author?.username}
              </Typography>
            </Box>
          </Box>
        </Link>

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
            src={`${API_URL}${tweet.mediaUrl}`}
            alt="Tweet Media"
            style={{ width: "100%", borderRadius: "8px", marginTop: "10px" }}
          />
        )}

        {tweet.originalTweet && renderOriginalTweet(tweet.originalTweet)}

        <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Badge badgeContent={likeCount} sx={{ "& .MuiBadge-badge": { backgroundColor: liked ? "red" : "default", color: "white" } }}>
            <IconButton
              onClick={handleLike}
              sx={{
                backgroundColor: liked ? "rgba(255, 0, 0, 0.1)" : "transparent",
                borderRadius: "50%",
                "&:hover": {
                  backgroundColor: liked ? "rgba(255, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <FavoriteIcon sx={{ color: liked ? "red" : "inherit" }} />
            </IconButton>
          </Badge>

          <Badge badgeContent={localRetweetCount} color="primary">
            <IconButton onClick={handleRetweet} color={retweeted ? "success" : "default"}>
              <RepeatIcon />
            </IconButton>
          </Badge>

          <IconButton onClick={() => setShowComments(!showComments)} color="primary">
            <ChatBubbleOutlineIcon />
          </IconButton>

          <Badge badgeContent={bookmarkCount} color="secondary">
            <IconButton onClick={handleBookmark} color={isBookmarked ? "primary" : "default"}>
              {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Badge>
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
