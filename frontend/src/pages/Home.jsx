import React, { useState, useEffect, useRef, useCallback } from "react";
import { Container, Typography, Grid, CircularProgress, Box } from "@mui/material";
import Tweet from "../components/Tweet";
import NewTweet from "../components/NewTweet";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
const Home = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emotionData, setEmotionData] = useState(null); // State for emotion analysis results
  const [visibleTweetId, setVisibleTweetId] = useState(null); // State for the currently visible tweet ID
  const [page, setPage] = useState(1); // State for pagination
  const [hasMore, setHasMore] = useState(true); // State to track if more tweets are available
  const videoRef = useRef(null); // Ref for the video element
  const canvasRef = useRef(null); // Ref for the canvas element
  const tweetsContainerRef = useRef(null); // Ref for the tweets container

  // Load tweets from the backend
  const fetchTweets = async (page) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/tweet/tweets?page=${page}&limit=10`);
      if (response.data.length > 0) {
        setTweets((prevTweets) => [...prevTweets, ...response.data]);
      } else {
        setHasMore(false); // No more tweets to load
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial tweets
  useEffect(() => {
    fetchTweets(page);
  }, []);

  // Add a new tweet and save to localStorage
  const addNewTweet = (newTweet) => {
    const updatedTweets = [newTweet, ...tweets];
    setTweets(updatedTweets);
    localStorage.setItem("tweets", JSON.stringify(updatedTweets));
  };

  // Initialize camera and WebSocket connection
  useEffect(() => {
    // Initialize camera
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Erreur lors de l'accès à la caméra :", err);
      }
    };

    initCamera();

    // Initialize WebSocket connection
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/emotions/");

    socket.onopen = () => {
      console.log("Connexion WebSocket établie.");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEmotionData(data); // Update emotion analysis results
    };

    socket.onerror = (error) => {
      console.error("Erreur WebSocket :", error);
    };

    // Capture and send frame every second
    const sendFrame = () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const frameData = canvasRef.current.toDataURL("image/jpeg", 0.8); // qualité 80%
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ frame: frameData }));
        }
      }
    };

    const intervalId = setInterval(sendFrame, 1000);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      socket.close();
    };
  }, []);

  // Save emotion for a tweet
  const saveEmotion = async (tweetId, emotion) => {
    try {
      const userId = "67d00c5e00073dd855bac0a5"; // Replace with the actual user ID
      await axios.post("http://localhost:5001/api/emotions/emotions/", {
        user_id: userId,
        tweet_id: tweetId,
        emotion: emotion,
      });
      //console.log("Emotion saved for tweet:", tweetId);
    } catch (error) {
      console.error("Error saving emotion:", error);
    }
  };

  // Track the currently visible tweet
  const handleScroll = useCallback(() => {
    if (tweetsContainerRef.current) {
      const container = tweetsContainerRef.current;
      const tweets = container.querySelectorAll(".tweet-item");

      // Check if the user has scrolled to the bottom
      if (
        container.scrollTop + container.clientHeight >= container.scrollHeight - 100 &&
        hasMore &&
        !loading
      ) {
        setPage((prevPage) => prevPage + 1); // Load the next page of tweets
        fetchTweets(page + 1);
      }

      // Track the first fully visible tweet
      for (let i = 0; i < tweets.length; i++) {
        const tweet = tweets[i];
        const rect = tweet.getBoundingClientRect();

        // Check if the tweet is fully visible as the first in the container
        if (rect.top >= 0 && rect.bottom <= container.clientHeight) {
          const tweetId = tweet.getAttribute("data-tweet-id");
          if (tweetId !== visibleTweetId) {
            setVisibleTweetId(tweetId);

            // Save the emotion for the visible tweet
            if (emotionData) {
              saveEmotion(tweetId, emotionData.dominant_emotion,'67d00c5e00073dd855bac0a5');
            }

            // Log the tweet ID and emotion data
            //console.log("Visible Tweet ID:", tweetId);
            //console.log("Emotion Data:", emotionData);
          }
          break;
        }
      }
    }
  }, [visibleTweetId, emotionData, hasMore, loading, page]);

  // Add scroll event listener to the tweets container
  useEffect(() => {
    const container = tweetsContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Fil d'actualité
      </Typography>

      {/* Formulaire pour publier un tweet */}
      <NewTweet onAddTweet={addNewTweet} />

      {/* Affichage des tweets */}
      {loading ? (
        <Grid container justifyContent="center" sx={{ marginTop: 3 }}>
          <CircularProgress />
        </Grid>
      ) : (
        <Box
          ref={tweetsContainerRef}
          sx={{
            height: "60vh",
            overflowY: "auto",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "10px",
          }}
        >
          <Grid container spacing={2}>
            {tweets.map((tweet) => (
              <Grid item xs={12} key={uuidv4()} className="tweet-item" data-tweet-id={tweet._id}>
                <Tweet tweet={tweet} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Emotion Analysis Section */}
      <Grid container spacing={4} sx={{ marginTop: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Résultats d'analyse des émotions
          </Typography>
          <div
            style={{
              backgroundColor: "#f2f2f2",
              padding: "10px",
              overflowY: "auto",
              height: "300px",
              whiteSpace: "pre-wrap",
            }}
          >
            {emotionData ? (
              <pre>{JSON.stringify(emotionData, null, 2)}</pre>
            ) : (
              <Typography variant="body1">En attente des résultats d'analyse...</Typography>
            )}
          </div>
        </Grid>
      </Grid>

      {/* Hidden video and canvas for capturing frames */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: "none" }} // Hide the video element
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Container>
  );
};

export default Home;