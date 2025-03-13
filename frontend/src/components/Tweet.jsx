import React, { useState, useEffect } from "react";
    import {
      Card,
      CardContent,
      Typography,
      Button,
      IconButton,
      TextField,
      Badge,
      Avatar,
      Box,
    } from "@mui/material";
    import FavoriteIcon from "@mui/icons-material/Favorite";
    import RepeatIcon from "@mui/icons-material/Repeat";
    import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
    import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
    import BookmarkIcon from "@mui/icons-material/Bookmark";
    import RetweetDialog from "./RetweetDialog";
    import { likeTweet, bookmarkTweet } from "../services/api";
    import TweetCommentForm from "./CommentForm";
    import TweetComments from "./TweetComments";

    const Tweet = ({ tweet, user, onUpdateTweet, onRetweet }) => {
      const [liked, setLiked] = useState(false);
      const [likeCount, setLikeCount] = useState(tweet?.userLikes?.length || 0);
      const [retweeted, setRetweeted] = useState(false);
      const [localRetweetCount, setLocalRetweetCount] = useState(tweet?.retweets?.length || 0);
      const [isBookmarked, setIsBookmarked] = useState(false);
      const [bookmarkCount, setBookmarkCount] = useState(tweet?.usersave?.length || 0);
      const [showComments, setShowComments] = useState(false);
      const [comments, setComments] = useState([]);
      const [openRetweetDialog, setOpenRetweetDialog] = useState(false);
      const current_user = user;
      const currentUserId = current_user?.id;

      useEffect(() => {
        setLiked(tweet?.userLikes?.includes(currentUserId));
        setIsBookmarked(tweet?.usersave?.includes(currentUserId));
        setComments(tweet?.idcommentaires || []);
      }, [tweet?.userLikes, tweet?.usersave, tweet?.idcommentaires]);

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

      const handleCommentAdded = (newComment) => {
        setComments([...comments, newComment]);
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
                src={`http://localhost:5001${originalTweet.mediaUrl}`}
                alt="Original Tweet Media"
                style={{ width: "100%", borderRadius: "8px", marginTop: "10px" }}
              />
            )}
          </Box>
        );
      };

      const likeBadgeColor = liked ? "error" : "default";
      const bookmarkBadgeColor = isBookmarked ? "primary" : "default";

      return (
        <Card sx={{ marginBottom: 2, padding: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar src={tweet?.author?.profilePicture} alt={tweet?.author?.username} />
              <Box ml={2}>
                <Typography variant="subtitle1">{tweet?.author?.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  @{tweet?.author?.username}
                </Typography>
              </Box>
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
                src={`http://localhost:5001${tweet.mediaUrl}`}
                alt="Tweet Media"
                style={{ width: "100%", borderRadius: "8px", marginTop: "10px" }}
              />
            )}

            {tweet.originalTweet && renderOriginalTweet(tweet.originalTweet)}

            <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {/* Like Button with Red Background */}
              <Badge
                badgeContent={likeCount}
                sx={{
                  "& .MuiBadge-badge": {
                    backgroundColor: likeBadgeColor === "error" ? "red" : "default",
                    color: "white",
                  },
                }}
              >
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

              {/* Retweet Button */}
              <Badge badgeContent={localRetweetCount} color="primary">
                <IconButton onClick={handleRetweet} color={retweeted ? "success" : "default"}>
                  <RepeatIcon />
                </IconButton>
              </Badge>

              {/* Comment Button */}
              <IconButton onClick={() => setShowComments(!showComments)} color="primary">
                <ChatBubbleOutlineIcon />
              </IconButton>

              {/* Bookmark Button */}
              <Badge
                badgeContent={bookmarkCount}
                sx={{
                  "& .MuiBadge-badge": {
                    backgroundColor: bookmarkBadgeColor === "primary" ? "blue" : "default",
                    color: "white",
                  },
                }}
              >
                <IconButton
                  onClick={handleBookmark}
                  sx={{
                    backgroundColor: isBookmarked ? "rgba(0, 0, 255, 0.1)" : "transparent",
                    borderRadius: "50%",
                    "&:hover": {
                      backgroundColor: isBookmarked ? "rgba(0, 0, 255, 0.2)" : "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  <BookmarkIcon sx={{ color: isBookmarked ? "blue" : "inherit" }} />
                </IconButton>
              </Badge>
            </Box>

            {showComments && (
              <Box mt={2}>
                <TweetCommentForm tweetId={tweet._id} onCommentAdded={handleCommentAdded} />
                <TweetComments comments={comments} />
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