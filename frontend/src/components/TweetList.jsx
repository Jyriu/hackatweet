// TweetList.js
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Grid, CircularProgress } from "@mui/material";
import Tweet from "../components/Tweet";

const TweetList = ({
  tweets,
  loading,
  hasMore,
  onScroll,
  onSaveEmotion,
  visibleTweetId,
  emotionData,
}) => {
  const tweetsContainerRef = useRef(null);
  const [localTweets, setLocalTweets] = useState(tweets);

  useEffect(() => {
    setLocalTweets(tweets);
  }, [tweets]);

  const handleRetweet = (newRetweet) => {
    setLocalTweets(prevTweets => [newRetweet, ...prevTweets]);
  };

  // Handle scroll event with debouncing
  const handleScroll = useCallback(() => {
    if (!tweetsContainerRef.current) return;

    const container = tweetsContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;

    // Check if we're at the end of the list (with a margin)
    if (
      scrollTop + clientHeight >= scrollHeight - 100 &&
      hasMore &&
      !loading
    ) {
      onScroll();
    }

    // Track the first fully visible tweet
    const tweetsElements = container.querySelectorAll(".tweet-item");
    for (let i = 0; i < tweetsElements.length; i++) {
      const tweet = tweetsElements[i];
      const rect = tweet.getBoundingClientRect();

      if (rect.top >= 0 && rect.bottom <= container.clientHeight) {
        const tweetId = tweet.getAttribute("data-tweet-id");
        if (tweetId !== visibleTweetId) {
          onSaveEmotion(tweetId, emotionData?.dominant_emotion);
        }
        break;
      }
    }
  }, [localTweets, visibleTweetId, emotionData, hasMore, loading, onScroll, onSaveEmotion]);

  // Add scroll event listener with debouncing
  useEffect(() => {
    const container = tweetsContainerRef.current;
    if (!container) return;

    const debouncedHandleScroll = () => {
      if (!loading) {
        handleScroll();
      }
    };

    container.addEventListener("scroll", debouncedHandleScroll);
    return () => container.removeEventListener("scroll", debouncedHandleScroll);
  }, [handleScroll, loading]);

  return (
    <Box
      ref={tweetsContainerRef}
      sx={{
        flex: 1,
        overflowY: "auto",
        padding: 2,
      }}
    >
      {loading && localTweets.length === 0 ? (
        <Grid container justifyContent="center" sx={{ marginTop: 3 }}>
          <CircularProgress />
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {localTweets.map((tweet) => (
            <Grid
              item
              xs={12}
              key={tweet._id}
              className="tweet-item"
              data-tweet-id={tweet._id}
              sx={{
                backgroundColor: "#f5f8fa",
                borderRadius: 2,
                padding: 2,
                marginBottom: 2,
              }}
            >
              <Tweet tweet={tweet} onRetweet={handleRetweet} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default TweetList;
