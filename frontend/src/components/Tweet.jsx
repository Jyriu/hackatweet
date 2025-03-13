import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Button, IconButton, TextField, Badge, Avatar, Box } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RepeatIcon from "@mui/icons-material/Repeat";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import RetweetDialog from "./RetweetDialog";
import { likeTweet, bookmarkTweet, getTweetComments } from "../services/api";
import CommentForm from "./CommentForm";
import TweetComments from "./TweetComments";
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openRetweetDialog, setOpenRetweetDialog] = useState(false);
  const current_user = user;
  const currentUserId = current_user?.id;
  const commentsPerPage = 5;

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Check if the tweet is liked or bookmarked by the current user
  useEffect(() => {
    setLiked(tweet?.userLikes?.includes(currentUserId));
    setIsBookmarked(tweet?.usersave?.includes(currentUserId));
  }, [tweet?.userLikes, tweet?.usersave, currentUserId]);

  // Fetch comments for the tweet
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getTweetComments(tweet._id, page, commentsPerPage);
        setComments(data.comments);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();
  }, [tweet._id, page, commentsPerPage]);

  // Handle like button click
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

  // Handle retweet button click
  const handleRetweet = () => {
    setOpenRetweetDialog(true);
  };

  // Close the retweet dialog
  const handleCloseRetweetDialog = () => {
    setOpenRetweetDialog(false);
  };

  // Handle retweet submission
  const handleRetweetSubmit = (newRetweet) => {
    setRetweeted(true);
    setLocalRetweetCount((prevCount) => prevCount + 1);
    onRetweet(newRetweet);
  };

  // Handle bookmark button click
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

  // Handle pagination for comments
  const handleChangePage = (event, value) => {
    setPage(value);
  };

  // Handle new comment addition
  const handleCommentAdded = async (newComment) => {
    try {
      setComments((prevComments) => [newComment, ...prevComments]);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Render hashtags
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

  // Render original tweet (for retweets)
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

  // Colors for like and bookmark badges
  const likeBadgeColor = liked ? "error" : "default";
  const bookmarkBadgeColor = isBookmarked ? "primary" : "default";

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

        {/* Tweet Content */}
        <Typography variant="body1">{tweet.text}</Typography>

        {/* Hashtags */}
        {tweet.hashtags && (
          <Box sx={{ marginTop: "8px" }}>{renderHashtags(tweet.hashtags)}</Box>
        )}

        {/* Link */}
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

        {/* Media */}
        {tweet.mediaUrl && (
          <img
            src={`${API_URL}${tweet.mediaUrl}`}
            alt="Tweet Media"
            style={{ width: "100%", borderRadius: "8px", marginTop: "10px" }}
          />
        )}

        {/* Original Tweet (for retweets) */}
        {tweet.originalTweet && renderOriginalTweet(tweet.originalTweet)}

        {/* Comment Count */}
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {tweet.commentCount || 0} Comments
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        <div className="like-button-container">
  <button onClick={handleLike} className={`like-button ${liked ? 'liked' : ''}`}>
    <FavoriteIcon />
    <span className="like-count">{tweet.userLikes.length}</span>
  </button>
</div>

          <Badge badgeContent={localRetweetCount} color="primary">
            <IconButton onClick={handleRetweet} color={retweeted ? "success" : "default"}>
              <RepeatIcon />
            </IconButton>
          </Badge>

          <IconButton onClick={() => setShowComments(!showComments)} color="primary">
            <ChatBubbleOutlineIcon />
          </IconButton>

          <div className="bookmark-button-container">
  <button onClick={handleBookmark} className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}>
    {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
    <span className="bookmark-count">{bookmarkCount}</span>
  </button>
</div>

        </Box>

        {/* Comments Section */}
        {showComments && (
          <Box mt={2}>
            <CommentForm tweetId={tweet._id} onCommentAdded={handleCommentAdded} />
            <TweetComments
              comments={comments}
              page={page}
              totalPages={totalPages}
              handleChangePage={handleChangePage}
            />
          </Box>
        )}

        {/* Retweet Dialog */}
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
