import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";

const CommentForm = ({ onAddComment }) => {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim() !== "") {
      onAddComment(newComment);
      setNewComment("");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Écrire un commentaire..."
        variant="outlined"
        size="small"
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <Button type="submit" variant="contained" sx={{ mt: 1 }}>
        Ajouter
      </Button>
    </Box>
  );
};

export default CommentForm;
