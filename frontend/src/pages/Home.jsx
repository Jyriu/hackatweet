import React, { useState, useEffect, useRef, useCallback } from "react";
import { Container, Typography, Box, Grid } from "@mui/material";
import TweetCreation from "../components/TweetCreation";
import TweetList from "../components/TweetList";
import TrendingHashtags from "../components/trendingHashtags";
import { fetchTweetsFromApi, fetchFollowingTweets, saveEmotionToApi } from "../services/api";
import useEmotionDetection from "../hooks/useEmotionDetection";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;
  const navigate = useNavigate();

  const { emotionData, videoRef, canvasRef } = useEmotionDetection();

  // Fonction pour charger les tweets
  const fetchTweets = useCallback(
    async (pageNumber) => {
      if (isFetching.current || !hasMore) return;
      isFetching.current = true;

      try {
        setLoading(true);
        const data = await fetchTweetsFromApi(pageNumber, userId);
        if (data && data?.tweets?.length > 0) {
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

  // Fonction pour charger les tweets des utilisateurs suivis
  const fetchFollowingTweetsHandler = useCallback(
    async (pageNumber) => {
      if (isFetching.current || !hasMoreFollowing) return;
      isFetching.current = true;

      try {
        setLoading(true);
        const data = await fetchFollowingTweets(pageNumber, userId);
        if (data && data?.tweets?.length > 0) {
          setFollowingTweets((prev) => {
            const newTweets = data.tweets.filter(
              (t) => !prev.some((ex) => ex._id === t._id)
            );
            return [...prev, ...newTweets];
          });
          setHasMoreFollowing(data.hasMore);
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

  // Charger les tweets initiaux
  useEffect(() => {
    if (!showFollowingTweets) fetchTweets(1);
    else fetchFollowingTweetsHandler(1);
  }, [fetchTweets, fetchFollowingTweetsHandler, showFollowingTweets]);

  // Charger plus de tweets lorsque la page change
  useEffect(() => {
    if (page > 1) {
      if (showFollowingTweets) {
        fetchFollowingTweetsHandler(page);
      } else {
        fetchTweets(page);
      }
    }
  }, [page, fetchTweets, fetchFollowingTweetsHandler, showFollowingTweets]);

  // Ajouter un nouveau tweet
  const addNewTweet = (newTweet) => {
    setTweets((prevTweets) => [newTweet, ...prevTweets]);
  };

  // Sauvegarder une émotion pour un tweet
  const saveEmotion = async (tweetId, emotion) => {
    try {
      await saveEmotionToApi(userId, tweetId, emotion);
    } catch (error) {
      console.error("Error saving emotion:", error);
    }
  };

  // Gérer le défilement pour charger plus de tweets
  const handleScroll = useCallback(() => {
    const lastId = showFollowingTweets
      ? followingTweets[followingTweets.length - 1]?._id
      : tweets[tweets.length - 1]?._id;
    if (lastId && lastId !== lastTweetRef.current) {
      lastTweetRef.current = lastId;
      setPage((prev) => prev + 1);
    }
  }, [tweets, followingTweets, showFollowingTweets]);

  // Afficher les tweets des utilisateurs suivis
  const handleShowFollowingTweets = () => {
    setShowFollowingTweets(true);
    setPage(1);
    setFollowingTweets([]);
    setHasMoreFollowing(true);
    lastTweetRef.current = null;
    fetchFollowingTweetsHandler(1);
  };

  // Afficher tous les tweets
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
        {/* Grille pour afficher les hashtags et les tweets côte à côte */}
        <Grid container spacing={2}>
          {/* Colonne des hashtags */}
          <Grid item xs={3}>
            <TrendingHashtags />
          </Grid>

          {/* Colonne des tweets */}
          <Grid item xs={9}>
            <TweetCreation onAddTweet={addNewTweet} />

            {/* En-tête */}
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

            {/* Liste des tweets */}
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
          </Grid>
        </Grid>

        {/* Éléments vidéo et canvas cachés */}
        <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </Container>
    </Box>
  );
};

export default Home;