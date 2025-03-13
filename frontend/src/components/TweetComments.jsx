import React from 'react';
import { Typography, Box, Pagination, Avatar } from '@mui/material';
import { format } from 'date-fns'; // For formatting the date

const TweetComments = ({ comments, page, totalPages, handleChangePage }) => {
  return (
    <Box mt={2}>
      {comments.map((comment) => (
        <Box
          key={comment._id}
          sx={{
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '10px',
          }}
        >
          {/* First Line: Avatar and Username */}
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Avatar
              src={comment.author?.profilePicture}
              alt={comment.author?.username}
              sx={{ width: 32, height: 32 }} // Slightly larger avatar
            />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {comment.author?.username}
            </Typography>
          </Box>

          {/* Comment Content */}
          <Typography variant="body2" sx={{ mb: 1 }}>
            {comment.text}
          </Typography>

          {/* Creation Date */}
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            {format(new Date(comment.date), 'MMM dd, yyyy HH:mm')} {/* Format the date */}
          </Typography>
        </Box>
      ))}

      {/* Pagination */}
      <Pagination
        count={totalPages}
        page={page}
        onChange={handleChangePage}
        sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
      />
    </Box>
  );
};

export default TweetComments;