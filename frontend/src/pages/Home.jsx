import React, { useState, useEffect, useRef, useCallback } from "react";
import { Container, Typography, Box } from "@mui/material";
import TweetCreation from "../components/TweetCreation";
import TweetList from "../components/TweetList";
import { fetchTweetsFromApi, saveEmotionToApi } from "../services/api";
import useEmotionDetection from "../hooks/useEmotionDetection";
import { useSelector } from "react-redux";


const Home = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleTweetId, setVisibleTweetId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isFetching = useRef(false);
  const lastTweetRef = useRef(null);
  const user = useSelector((state) => state.user.currentUser);
  //const user = JSON.parse(localStorage.getItem("user")); // Parse the user object
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

  // Handle scroll event
  const handleScroll = useCallback(() => {
    const lastTweetId = tweets[tweets.length - 1]?._id;

    if (lastTweetId && lastTweetId !== lastTweetRef.current) {
      lastTweetRef.current = lastTweetId;
      setPage((prevPage) => prevPage + 1);
    }
  }, [tweets]);

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

        {/* Tweet Creation Section */}
        <TweetCreation onAddTweet={addNewTweet} />

        {/* Tweet List Section */}
        <TweetList
          tweets={tweets}
          loading={loading}
          hasMore={hasMore}
          user = {user}
          onScroll={handleScroll}
          onSaveEmotion={saveEmotion}
          visibleTweetId={visibleTweetId}
          emotionData={emotionData}
        />

        {/* Hidden Video and Canvas Elements */}
        <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </Container>
    </Box>
  );
};

export default Home;