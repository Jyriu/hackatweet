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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const tweetsContainerRef = useRef(null);
  const isFetching = useRef(false); // To prevent duplicate fetches
  const userId = "67d00c5e00073dd855bac0a5";
  // Fetch tweets from the backend
  const fetchTweets = useCallback(async (pageNumber) => {
    if (isFetching.current || !hasMore) return; // Prevent duplicate calls
    isFetching.current = true; // Lock fetching

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/tweet/tweets?page=${pageNumber}&limit=10&userId=${userId}`);
console.log(response)
      if (response.data.tweets.length > 0) {
        setTweets((prevTweets) => {
          // Filter out duplicates before adding new tweets
          const newTweets = response.data.tweets.filter(
            (newTweet) => !prevTweets.some((existingTweet) => existingTweet._id === newTweet._id)
          );
          return [...prevTweets, ...newTweets];
        });
      } else {
        setTweets((prevTweets) => [...prevTweets, ...response.data]); // Ajoute les tweets pour les pages suivantes
      }

      setHasMore(response.data.length > 0); // Vérifie s'il y a plus de tweets à charger
    } catch (err) {
      console.error("Erreur lors de la récupération des tweets:", err);
    } finally {
      setLoading(false);
      isFetching.current = false; // Unlock fetching
    }
  }, [hasMore]);

  // Charger les tweets au montage du composant
  useEffect(() => {
    fetchTweets(1); // Load the first page on mount
  }, [fetchTweets]);

  // Load more tweets when the page changes
  useEffect(() => {
    if (page > 1) fetchTweets(page); // Fetch new tweets only if page > 1
  }, [page, fetchTweets]);

  // Add a new tweet
  const addNewTweet = (newTweet) => {
    setTweets((prevTweets) => [newTweet, ...prevTweets]); // Add the new tweet to the top
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
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'émotion:", error);
    }
  };

  // Handle scroll event with debouncing
  const lastTweetRef = useRef(null); // Garde en mémoire le dernier tweet affiché

const handleScroll = useCallback(() => {
  if (!tweetsContainerRef.current) return;

  const container = tweetsContainerRef.current;
  const { scrollTop, scrollHeight, clientHeight } = container;

  // Vérifie si on est à la fin de la liste (avec une marge de 100px)
  if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore && !loading && !isFetching.current) {
    const lastTweetId = tweets[tweets.length - 1]?._id; // Récupère l'ID du dernier tweet

    // Vérifie si on a atteint un nouveau dernier tweet avant d'incrémenter la page
    if (lastTweetId && lastTweetId !== lastTweetRef.current) {
      lastTweetRef.current = lastTweetId; // Met à jour la référence
      setPage((prevPage) => prevPage + 1);
    }
  }

  // Suivi du premier tweet visible
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
}, [tweets, visibleTweetId, emotionData, hasMore, loading]);

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
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Fil d'actualité
      </Typography>

      <NewTweet onAddTweet={addNewTweet} />

      {/* Affichage des tweets */}
      {loading && tweets.length === 0 ? (
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