import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { addComment } from "../services/api";

const CommentForm = ({ tweetId, onCommentAdded }) => {
    const [commentText, setCommentText] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (commentText.trim() !== '') {
            try {
                const newComment = await addComment(tweetId, commentText);
                onCommentAdded(newComment); // Call the correct prop here
                setCommentText('');
            } catch (error) {
                console.error('Error adding comment:', error);
                // Handle the error appropriately, maybe show an error message
            }
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} mt={2}>
            <TextField
                fullWidth
                label="Add a comment"
                variant="outlined"
                size="small"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
            />
            <Button type="submit" variant="contained" sx={{ mt: 1 }}>
                Submit
            </Button>
        </Box>
    );
};

export default CommentForm;