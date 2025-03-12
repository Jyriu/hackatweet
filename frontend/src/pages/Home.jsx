import React, { useState, useEffect, useRef } from "react";
import { Container, Typography, Grid, CircularProgress, Box, Button } from "@mui/material";
import Tweet from "../components/Tweet";
import NewTweet from "../components/NewTweet";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(
    JSON.parse(localStorage.getItem("cameraEnabled")) || false
  );
  const [emotionData, setEmotionData] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Références pour la gestion de la caméra
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  // Fonction pour récupérer les tweets
  const fetchTweets = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/tweet/tweets?limit=10`);
      setTweets(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des tweets :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  const addNewTweet = (newTweet) => {
    setTweets((prevTweets) => [newTweet, ...prevTweets]);
    localStorage.setItem("tweets", JSON.stringify([newTweet, ...tweets]));
  };

  // Activation/Désactivation de la caméra
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
      } catch (err) {
        console.error("Erreur lors de l'accès à la caméra :", err);
      }
    };

    if (cameraEnabled) {
      initCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraEnabled]);

  // Envoi des images au WebSocket
  useEffect(() => {
    if (!cameraEnabled) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const socket = new WebSocket("ws://127.0.0.1:8000/ws/emotions/");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Connexion WebSocket établie.");
      intervalRef.current = setInterval(sendFrame, 1000);
    };

    socket.onclose = () => {
      console.log("Connexion WebSocket fermée.");
    };

    const sendFrame = () => {
      if (!streamRef.current) return;
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;

      const imageCapture = new ImageCapture(videoTrack);
      imageCapture.grabFrame().then((bitmap) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const frameData = canvas.toDataURL("image/jpeg", 0.8);

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ frame: frameData }));
        }
      }).catch((err) => console.error("Erreur capture image :", err));
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [cameraEnabled]);

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      {/* Barre de navigation */}
      

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
              <Grid item xs={12} key={uuidv4()} className="tweet-item">
                <Tweet tweet={tweet} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default Home;
