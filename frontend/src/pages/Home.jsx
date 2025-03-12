import React, { useState } from "react";
import { Container, Typography, Box, Alert } from "@mui/material";
import { useTweets } from "../hooks/useTweets";
import NewTweet from "../components/NewTweet";
import { useAuth } from "../hooks/useAuth";
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

  console.log("Rendu du composant Home - Test avec NewTweet simplifié");
  
  // Utiliser le hook auth pour obtenir l'utilisateur actuel
  const { user } = useAuth();
  console.log("Utilisateur connecté:", user);
  
  // Utiliser le hook useTweets pour récupérer les tweets uniquement
  const { tweets, loading, error, createTweet } = useTweets();
  console.log("Tweets chargés:", tweets);
  
  // State pour suivre les erreurs de création de tweet
  const [tweetError, setTweetError] = useState(null);
  
  // Function to add a new tweet
  const addNewTweet = async (newTweetData) => {
    try {
      console.log("Tentative de création d'un tweet avec:", newTweetData);
      
      if (!user) {
        setTweetError("Vous devez être connecté pour tweeter");
        return;
      }
      
      // Les hashtags sont extraits automatiquement côté serveur
      const simplifiedTweetData = {
        content: newTweetData.content,
        // On pourrait ajouter mediaUrl si on avait des médias
      };
      
      console.log("Données simplifiées pour l'API:", simplifiedTweetData);
      
      const result = await createTweet(simplifiedTweetData);
      console.log("Résultat de la création:", result);
      setTweetError(null);
    } catch (error) {
      console.error("Error creating tweet:", error);
      setTweetError("Impossible de créer le tweet. Vérifiez la console pour plus d'informations.");
    }
  };
  
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
