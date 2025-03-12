import React, { useState } from "react";
import { Card, CardContent, Typography, Button, IconButton, TextField } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RepeatIcon from "@mui/icons-material/Repeat";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

const Tweet = ({ tweet }) => {
  //const [likes, setLikes] = useState(tweet.userLikes.length);
  const [liked, setLiked] = useState(false);
  const [retweets, setRetweets] = useState(0);
  const [retweeted, setRetweeted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const handleLike = () => {
    //setLikes(liked ? likes - 1 : likes + 1);
    setLiked(!liked);
  };

  const handleRetweet = () => {
    setRetweets(retweeted ? retweets - 1 : retweets + 1);
    setRetweeted(!retweeted);
  };

  const handleAddComment = () => {
    if (newComment.trim() !== "") {
      setComments([...comments, newComment]);
      setNewComment("");
    }
  };

  return (
    <Card sx={{ marginBottom: 2, padding: 2 }}>
      <CardContent>
        <Typography variant="h6">{tweet._id}</Typography>
        <Typography variant="body1">{tweet.text}</Typography>
        {tweet.mediaUrl && (
          <img src={tweet.mediaUrl} alt="Tweet media" style={{ width: "100%", borderRadius: "10px", marginTop: "10px" }} />
        )}
        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
          <IconButton onClick={handleLike} color={liked ? "error" : "default"}>
            <FavoriteIcon />
          </IconButton>
          {/* <Typography>{likes}</Typography> */}

          <IconButton onClick={handleRetweet} color={retweeted ? "success" : "default"}>
            <RepeatIcon />
          </IconButton>
          <Typography>{retweets}</Typography>

          <IconButton onClick={() => setShowComments(!showComments)} color="primary">
            <ChatBubbleOutlineIcon />
          </IconButton>
          <Typography>{comments.length}</Typography>
        </div>

        {showComments && (
          <div style={{ marginTop: "10px" }}>
            {comments.map((comment, index) => (
              <Typography key={index} variant="body2" sx={{ backgroundColor: "#f5f5f5", padding: 1, borderRadius: "5px", marginBottom: "5px" }}>
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
              sx={{ marginTop: 1 }}
            />
            <Button variant="contained" sx={{ marginTop: 1 }} onClick={handleAddComment}>
              Ajouter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Tweet;


