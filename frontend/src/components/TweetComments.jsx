import React, { useState } from "react";
import { Typography, Box, Pagination } from "@mui/material";

const TweetComments = ({ comments }) => {
  const [page, setPage] = useState(1);
  const commentsPerPage = 5;

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  const displayedComments = comments.slice((page - 1) * commentsPerPage, page * commentsPerPage);

  return (
    <Box mt={2}>
      {displayedComments.map((comment, index) => (
        <Typography
          key={comment._id || index}
          variant="body2"
          sx={{
            backgroundColor: "#f5f5f5",
            padding: "8px",
            borderRadius: "5px",
            marginBottom: "5px",
          }}
        >
          {comment.text}
        </Typography>
      ))}
      <Pagination
        count={Math.ceil(comments.length / commentsPerPage)}
        page={page}
        onChange={handleChangePage}
        sx={{ mt: 2, display: "flex", justifyContent: "center" }}
      />
    </Box>
  );
};

export default TweetComments;
