import React, { useState, useEffect, useRef, useCallback } from "react";
import { Container, Typography, Grid, CircularProgress, Box } from "@mui/material";
import Tweet from "../components/Tweet";
import NewTweet from "../components/NewTweet";
import { fetchTweetsFromApi, saveEmotionToApi } from "../services/api";
import useEmotionDetection from "../hooks/useEmotionDetection"; // Import the hook

const Home = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleTweetId, setVisibleTweetId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const tweetsContainerRef = useRef(null);
  const isFetching = useRef(false);
  const lastTweetRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user")); // Parse the user object
  const userId = user?.id;

  // Use the emotion detection hook
  const { emotionData, videoRef, canvasRef } = useEmotionDetection();

  // Fetch tweets from the backend
  const fetchTweets = useCallback(
    async (pageNumber) => {
      if (isFetching.current || !hasMore) return;
      isFetching.current = true;

      try {
        setLoading(true);
        const data = await fetchTweetsFromApi(pageNumber, userId);
        if (data && data.tweets.length > 0) {
          setTweets((prevTweets) => {
            const newTweets = data.tweets.filter(
              (newTweet) => !prevTweets.some((existingTweet) => existingTweet._id === newTweet._id)
            );
            return [...prevTweets, ...newTweets];
          });
          setHasMore(data.hasMore);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching tweets:", error);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    [hasMore, userId]
  );

  // Load initial tweets
  useEffect(() => {
    fetchTweets(1);
  }, [fetchTweets]);

  // Load more tweets when the page changes
  useEffect(() => {
    if (page > 1) fetchTweets(page);
  }, [page, fetchTweets]);

  // Add a new tweet
  const addNewTweet = (newTweet) => {
    setTweets((prevTweets) => [newTweet, ...prevTweets]);
  };

  // Save emotion for a tweet
  const saveEmotion = async (tweetId, emotion) => {
    try {
      await saveEmotionToApi(userId, tweetId, emotion);
    } catch (error) {
      console.error("Error saving emotion:", error);
    }
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
      !loading &&
      !isFetching.current
    ) {
      const lastTweetId = tweets[tweets.length - 1]?._id;

      if (lastTweetId && lastTweetId !== lastTweetRef.current) {
        lastTweetRef.current = lastTweetId;
        setPage((prevPage) => prevPage + 1);
      }
    }

    // Track the first fully visible tweet
    const tweetsElements = container.querySelectorAll(".tweet-item");
    for (let i = 0; i < tweetsElements.length; i++) {
      const tweet = tweetsElements[i];
      const rect = tweet.getBoundingClientRect();

      if (rect.top >= 0 && rect.bottom <= container.clientHeight) {
        const tweetId = tweet.getAttribute("data-tweet-id");
        if (tweetId !== visibleTweetId) {
          setVisibleTweetId(tweetId);
          if (emotionData) {
            saveEmotion(tweetId, emotionData.dominant_emotion);
          }
        }
        break;
      }
    }
  }, [tweets, visibleTweetId, emotionData, hasMore, loading, userId]);

  // Add scroll event listener with debouncing
  useEffect(() => {
    const container = tweetsContainerRef.current;
    if (!container) return;

    const debouncedHandleScroll = () => {
      if (!loading && !isFetching.current) {
        handleScroll();
      }
    };

    container.addEventListener("scroll", debouncedHandleScroll);
    return () => container.removeEventListener("scroll", debouncedHandleScroll);
  }, [handleScroll, loading]);

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundColor: "#f5f8fa", // Background color for the entire page
      }}
    >
      {/* Bigger Container */}
      <Container
        maxWidth="md"
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          backgroundColor: "#f5f8fa", // Same background color
        }}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: "#f5f8fa",
            borderBottom: "1px solid #e0e0e0",
            padding: 2,
            zIndex: 1000,
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="#545f69">
            Fil d'actualité
          </Typography>
        </Box>

        {/* New Tweet Section */}
        <Box
          sx={{
            backgroundColor: "#f5f8fa",
            borderBottom: "1px solid #e0e0e0",
            padding: 2,
          }}
        >
          <NewTweet onAddTweet={addNewTweet} />
        </Box>

        {/* Tweets List - Scrollable Section */}
        <Box
          ref={tweetsContainerRef}
          sx={{
            flex: 1,
            overflowY: "auto",
            padding: 2,
          }}
        >
          {loading && tweets.length === 0 ? (
            <Grid container justifyContent="center" sx={{ marginTop: 3 }}>
              <CircularProgress />
            </Grid>
          ) : (
            <Grid container spacing={2}>
              {tweets.map((tweet) => (
                <Grid
                  item
                  xs={12}
                  key={tweet._id}
                  className="tweet-item"
                  data-tweet-id={tweet._id}
                  sx={{
                    backgroundColor: "#f5f8fa", // White background for each tweet
                    borderRadius: 2, // Rounded corners for tweets
                    padding: 2, // Padding inside each tweet
                    marginBottom: 2, // Space between tweets
                  }}
                >
                  <Tweet tweet={tweet} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Hidden Video and Canvas Elements */}
        <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </Container>
    </Box>
  );
};

export default Home;