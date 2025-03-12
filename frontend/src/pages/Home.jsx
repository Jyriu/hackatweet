import React, { useState, useEffect, useRef, useCallback } from "react";
import { Container, Typography, Grid, CircularProgress, Box } from "@mui/material";
import Tweet from "../components/Tweet";
import NewTweet from "../components/NewTweet";
import axios from "axios";

const Home = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emotionData, setEmotionData] = useState(null);
  const [visibleTweetId, setVisibleTweetId] = useState(null);
  const [hasMore, setHasMore] = useState(true); // Pour la pagination
  const [page, setPage] = useState(1); // Pour la pagination
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const tweetsContainerRef = useRef(null);

  const url = import.meta.env.VITE_BACKEND_URL;

  // Charger les tweets depuis le backend
  const fetchTweets = async (page = 1) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${url}/api/tweet/tweets?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (page === 1) {
        setTweets(response.data); // Remplace les tweets pour la première page
      } else {
        setTweets((prevTweets) => [...prevTweets, ...response.data]); // Ajoute les tweets pour les pages suivantes
      }

      setHasMore(response.data.length > 0); // Vérifie s'il y a plus de tweets à charger
    } catch (err) {
      console.error("Erreur lors de la récupération des tweets:", err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les tweets au montage du composant
  useEffect(() => {
    fetchTweets(page);
  }, [page]);

  // Ajouter un nouveau tweet à la liste
  const addNewTweet = (newTweet) => {
    setTweets([newTweet, ...tweets]);
  };

  // Initialiser la caméra et la connexion WebSocket
  useEffect(() => {
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

    const socket = new WebSocket("ws://127.0.0.1:8000/ws/emotions/");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEmotionData(data);
    };

    socket.onerror = (error) => {
      console.error("Erreur WebSocket :", error);
    };

    const sendFrame = () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const frameData = canvasRef.current.toDataURL("image/jpeg", 0.8);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ frame: frameData }));
        }
      }
    };

    const intervalId = setInterval(sendFrame, 1000);

    return () => {
      clearInterval(intervalId);
      socket.close();
    };
  }, []);

  // Sauvegarder l'émotion pour un tweet
  const saveEmotion = async (tweetId, emotion) => {
    try {
      const userId = "67d00c5e00073dd855bac0a5"; // Remplacez par l'ID de l'utilisateur réel
      await axios.post(`${url}/api/emotions/emotions/`, {
        user_id: userId,
        tweet_id: tweetId,
        emotion: emotion,
      });
      console.log("Emotion sauvegardée pour le tweet:", tweetId);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'émotion:", error);
    }
  };

  // Suivre le tweet visible
  const handleScroll = useCallback(() => {
    if (tweetsContainerRef.current) {
      const container = tweetsContainerRef.current;
      const tweets = container.querySelectorAll(".tweet-item");

      // Vérifier si l'utilisateur a fait défiler jusqu'en bas
      if (
        container.scrollTop + container.clientHeight >= container.scrollHeight - 100 &&
        hasMore &&
        !loading
      ) {
        setPage((prevPage) => prevPage + 1); // Charger la page suivante des tweets
      }

      // Suivre le premier tweet entièrement visible
      for (let i = 0; i < tweets.length; i++) {
        const tweet = tweets[i];
        const rect = tweet.getBoundingClientRect();

        if (rect.top >= 0 && rect.bottom <= container.clientHeight) {
          const tweetId = tweet.getAttribute("data-tweet-id");
          if (tweetId !== visibleTweetId) {
            setVisibleTweetId(tweetId);

            // Sauvegarder l'émotion pour le tweet visible
            if (emotionData) {
              saveEmotion(tweetId, emotionData.dominant_emotion);
            }

            console.log("Tweet visible ID:", tweetId);
            console.log("Données d'émotion:", emotionData);
          }
          break;
        }
      }
    }
  }, [visibleTweetId, hasMore, loading, emotionData]);

  // Ajouter un écouteur de défilement
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

      <NewTweet onAddTweet={addNewTweet} />

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
              <Grid item xs={12} key={tweet._id} className="tweet-item" data-tweet-id={tweet._id}>
                <Tweet tweet={tweet} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

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

      <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Container>
  );
};

export default Home;