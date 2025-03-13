import React, { useState, useEffect, useRef, useCallback } from "react";
import { Container, Typography, Box } from "@mui/material";
import TweetCreation from "../components/TweetCreation";
import TweetList from "../components/TweetList";
import { fetchTweetsFromApi, fetchFollowingTweets, saveEmotionToApi } from "../services/api";
import useEmotionDetection from "../hooks/useEmotionDetection";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import TrendingHashtags from "../components/trendingHashtags";

const Home = () => {
  const [tweets, setTweets] = useState([]);
  const [followingTweets, setFollowingTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleTweetId, setVisibleTweetId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasMoreFollowing, setHasMoreFollowing] = useState(true);
  const [showFollowingTweets, setShowFollowingTweets] = useState(false);
  const isFetching = useRef(false);
  const lastTweetRef = useRef(null);
  const user = useSelector((state) => state.user.currentUser);
  const userId = user?._id;
  const navigate = useNavigate();

  // Use the emotion detection hook only if `user.cameraOn` is true
  const { emotionData, videoRef, canvasRef } = useEmotionDetection(user?.cameraOn);

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
        if (error.response?.data?.message === "Authentification requise") {
          navigate("/login");
        }
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    [hasMore, userId, navigate]
  );

  // Fetch following tweets from the backend
  const fetchFollowingTweetsHandler = useCallback(
    async (pageNumber) => {
      if (isFetching.current || !hasMoreFollowing) return;
      isFetching.current = true;

      try {
        setLoading(true);
        const data = await fetchFollowingTweets(pageNumber, userId);
        const followingData = data.tweets ? data.tweets : data;
        if (followingData && followingData.length > 0) {
          setFollowingTweets((prev) => {
            const newTweets = followingData.filter(
              (t) => !prev.some((ex) => ex._id === t._id)
            );
            return [...prev, ...newTweets];
          });
          setHasMoreFollowing(data.hasMore !== undefined ? data.hasMore : false);
        } else {
          setHasMoreFollowing(false);
        }
      } catch (error) {
        console.error("Error fetching following tweets:", error);
        if (error.response?.data?.message === "Authentification requise") {
          navigate("/login");
        }
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    [hasMoreFollowing, userId, navigate]
  );

  // Load initial tweets
  useEffect(() => {
    if (!showFollowingTweets) fetchTweets(1);
    else fetchFollowingTweetsHandler(1);
  }, [fetchTweets, fetchFollowingTweetsHandler, showFollowingTweets]);

  // Load more tweets when the page changes
  useEffect(() => {
    if (page > 1) {
      if (showFollowingTweets) {
        fetchFollowingTweetsHandler(page);
      } else {
        fetchTweets(page);
      }
    }
  }, [page, fetchTweets, fetchFollowingTweetsHandler, showFollowingTweets]);

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
    const lastId = showFollowingTweets
      ? followingTweets[followingTweets.length - 1]?._id
      : tweets[tweets.length - 1]?._id;
    if (lastId && lastId !== lastTweetRef.current) {
      lastTweetRef.current = lastId;
      setPage((prev) => prev + 1);
    }
  }, [tweets, followingTweets, showFollowingTweets]);

  // Handle button click to show following tweets
  const handleShowFollowingTweets = () => {
    setShowFollowingTweets(true);
    setPage(1);
    setFollowingTweets([]);
    setHasMoreFollowing(true);
    lastTweetRef.current = null;
    fetchFollowingTweetsHandler(1);
  };

  // Handle button click to show all tweets
  const handleShowAllTweets = () => {
    setShowFollowingTweets(false);
    setPage(1);
    setTweets([]);
    setHasMore(true);
    lastTweetRef.current = null;
    fetchTweets(1);
  };

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundColor: "#f5f8fa",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          backgroundColor: "#f5f8fa",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: "#f5f8fa",
            borderBottom: "1px solid #e0e0e0",
            padding: 2,
            zIndex: 1000,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="#545f69">
            <button
              style={{ textDecoration: "none", color: "#545f69", background: "none", border: "none", cursor: "pointer" }}
              onClick={handleShowAllTweets}
            >
              Fil d'actualité
            </button>
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="#545f69">
            <button
              style={{ textDecoration: "none", color: "#545f69", background: "none", border: "none", cursor: "pointer" }}
              onClick={handleShowFollowingTweets}
            >
              Actualité recommandée
            </button>
          </Typography>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            display: "flex",
            flexGrow: 1,
            overflow: "hidden", // Ensure the parent container doesn't scroll
          }}
        >
          {/* Left Side: Trending Hashtags */}
          <Box
            sx={{
              width: "25%", // 25% of the container width
              padding: 2,
              overflowY: "auto", // Enable scrolling for trending hashtags
              borderRight: "1px solid #e0e0e0",
            }}
          >
            <TrendingHashtags />
          </Box>

          {/* Right Side: Tweet Content */}
          <Box
            sx={{
              width: "75%", // 75% of the container width
              padding: 2,
              overflowY: "auto", // Enable scrolling for tweet content
            }}
          >
            {/* Fixed TweetCreation Component */}
            <Box
              sx={{
                position: "sticky",
                top: 0,
                backgroundColor: "#f5f8fa",
                zIndex: 1000,
                paddingBottom: 2,
              }}
            >
              <TweetCreation onAddTweet={addNewTweet} />
            </Box>

            {/* Scrollable TweetList Component */}
            <Box sx={{ marginTop: 2 }}>
              {showFollowingTweets ? (
                <TweetList
                  tweets={followingTweets}
                  loading={loading}
                  hasMore={hasMoreFollowing}
                  user={user}
                  onScroll={handleScroll}
                  onSaveEmotion={saveEmotion}
                  visibleTweetId={visibleTweetId}
                  emotionData={emotionData}
                />
              ) : (
                <TweetList
                  tweets={tweets}
                  loading={loading}
                  hasMore={hasMore}
                  user={user}
                  onScroll={handleScroll}
                  onSaveEmotion={saveEmotion}
                  visibleTweetId={visibleTweetId}
                  emotionData={emotionData}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Conditionally render video and canvas elements */}
        {user?.cameraOn && (
          <>
            <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}
      </Container>
    </Box>
  );
};

export default Home;