import React, { useState, useEffect, useRef, useCallback } from "react";
import { Container, Typography, Grid, CircularProgress, Box } from "@mui/material";
import Tweet from "../components/Tweet";
import NewTweet from "../components/NewTweet";

const Home = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emotionData, setEmotionData] = useState(null); // State for emotion analysis results
  const [visibleTweetId, setVisibleTweetId] = useState(null); // State for the currently visible tweet ID
  const videoRef = useRef(null); // Ref for the video element
  const canvasRef = useRef(null); // Ref for the canvas element
  const tweetsContainerRef = useRef(null); // Ref for the tweets container


  
  // Charger les tweets depuis localStorage au démarrage
  useEffect(() => {
    const storedTweets = localStorage.getItem("tweets");
    if (storedTweets) {
      setTweets(JSON.parse(storedTweets));
    }
    setLoading(false);
  }, []);

  // Ajouter un tweet et le sauvegarder dans localStorage
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

  // Track the currently visible tweet
  const handleScroll = useCallback(() => {
    if (tweetsContainerRef.current) {
      const container = tweetsContainerRef.current;
      const tweets = container.querySelectorAll(".tweet-item");

      for (let i = 0; i < tweets.length; i++) {
        const tweet = tweets[i];
        const rect = tweet.getBoundingClientRect();

        // Check if the tweet is fully visible as the first in the container
        if (rect.top >= 0 && rect.bottom <= container.clientHeight) {
          const tweetId = tweet.getAttribute("data-tweet-id");
          if (tweetId !== visibleTweetId) {
            setVisibleTweetId(tweetId);

            // Log the tweet ID and emotion data
            console.log("Visible Tweet ID:", tweetId);
            console.log("Emotion Data:", emotionData);
          }
          break;
        }
      }
    }
  }, [visibleTweetId, emotionData]);

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
              <Grid item xs={12} key={tweet.idTweet} className="tweet-item" data-tweet-id={tweet.idTweet}>
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