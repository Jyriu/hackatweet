import React from "react";
import { Box } from "@mui/material";
import NewTweet from "../components/NewTweet";

const TweetCreation = ({ onAddTweet }) => {
  return (
    <Box
      sx={{
        backgroundColor: "#f5f8fa",
        borderBottom: "1px solid #e0e0e0",
        padding: 2,
      }}
    >
      <NewTweet onAddTweet={onAddTweet} />
    </Box>
  );
};

export default TweetCreation;