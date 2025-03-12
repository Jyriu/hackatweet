import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Container, 
  Typography, 
  Grid, 
  CircularProgress, 
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Alert
} from "@mui/material";
import Tweet from "../components/Tweet";
import NewTweet from "../components/NewTweet";
import { useTweets } from "../hooks/useTweets";
import { useAuth } from "../hooks/useAuth";
import { useDispatch } from "react-redux";
import { toggleUserSetting } from "../redux/actions/userActions";
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const Home = () => {
  const { 
    tweets, 
    loading, 
    error, 
    hasMore, 
    loadMoreTweets, 
    createTweet,
    saveEmotionForTweet 
  } = useTweets();
  
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [emotionData, setEmotionData] = useState(null); // State for emotion analysis results
  const [visibleTweetId, setVisibleTweetId] = useState(null); // State for the currently visible tweet ID
  const videoRef = useRef(null); // Ref for the video element
  const canvasRef = useRef(null); // Ref for the canvas element
  const tweetsContainerRef = useRef(null); // Ref for the tweets container
  const emotionIntervalRef = useRef(null); // Ref for the interval that sends frames
  const [showCameraDialog, setShowCameraDialog] = useState(false); // État pour afficher/masquer la boîte de dialogue
  const [cameraError, setCameraError] = useState(null); // État pour stocker les erreurs de caméra

  useEffect(() => {
    // Si l'utilisateur n'a pas encore défini de préférence pour la caméra, afficher la boîte de dialogue
    if (user && user.cameraOn === undefined) {
      setShowCameraDialog(true);
    }
  }, [user]);
  
  // Fonction pour gérer l'autorisation de la caméra
  const handleCameraPermission = async (allow) => {
    try {
      // Mettre à jour la préférence de caméra dans le backend
      await dispatch(toggleUserSetting('cameraOn')).unwrap();
      
      setShowCameraDialog(false);
      
      // Si l'utilisateur a autorisé la caméra, initialiser la caméra
      if (allow) {
        initCamera();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des préférences de caméra:", error);
      setCameraError("Impossible de mettre à jour les préférences de caméra. Veuillez réessayer.");
    }
  };

  // Function to add a new tweet
  const addNewTweet = async (newTweetData) => {
    try {
      await createTweet(newTweetData);
    } catch (error) {
      console.error("Error creating tweet:", error);
    }
  };

  // Initialize camera and emotion analysis
  const initCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Démarrer l'analyse d'émotions à intervalle régulier
          if (!emotionIntervalRef.current) {
            emotionIntervalRef.current = setInterval(analyzeEmotion, 3000);
          }
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Impossible d'accéder à la caméra. Veuillez vérifier les autorisations du navigateur.");
    }
  };

  // Effect pour initialiser la caméra si l'utilisateur l'a autorisée
  useEffect(() => {
    if (user && user.cameraOn) {
      initCamera();
    }
    
    // Cleanup function
    return () => {
      // Arrêter l'intervalle d'analyse d'émotions
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
        emotionIntervalRef.current = null;
      }
      
      // Arrêter la caméra
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [user]);

  // Réagir aux changements de tweet visible
  useEffect(() => {
    // Si le tweet visible change et que nous avons des données d'émotion,
    // enregistrer l'émotion pour le nouveau tweet
    if (visibleTweetId && emotionData?.dominant_emotion) {
      saveEmotion(visibleTweetId, emotionData.dominant_emotion);
    }
  }, [visibleTweetId, emotionData]);

  // Fonction pour capturer et analyser les émotions
  const analyzeEmotion = async () => {
    if (!videoRef.current || !canvasRef.current || !visibleTweetId) return;
    
    try {
      // Capturer les images de la webcam
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Convertir le canvas en données d'image
      const frameData = canvasRef.current.toDataURL('image/jpeg').split(',')[1]; // Récupérer uniquement les données base64
      
      // Créer un FormData pour envoyer les images à l'API
      const formData = new FormData();
      
      // Créer 3 captures d'image pour l'API (elle en demande 3)
      // On utilise la même image trois fois pour simplifier
      const blob1 = await fetch(`data:image/jpeg;base64,${frameData}`).then(res => res.blob());
      const blob2 = await fetch(`data:image/jpeg;base64,${frameData}`).then(res => res.blob());
      const blob3 = await fetch(`data:image/jpeg;base64,${frameData}`).then(res => res.blob());
      
      formData.append('screenshot1', blob1, 'capture1.jpg');
      formData.append('screenshot2', blob2, 'capture2.jpg');
      formData.append('screenshot3', blob3, 'capture3.jpg');
      
      // Appel direct à l'API d'analyse d'émotions
      const response = await axios.post('http://localhost:5001/api/analyze-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Extraire et traiter les données d'émotions
      const result = response.data;
      
      // Si nous avons des résultats, mettre à jour l'état
      if (result.results && result.results.length > 0) {
        const firstResult = result.results[0];
        const emotionResult = {
          dominant_emotion: firstResult.dominant_emotion,
          emotion_scores: firstResult.emotion_details
        };
        
        setEmotionData(emotionResult);
        
        // Si nous avons un tweet visible, enregistrer l'émotion
        if (visibleTweetId) {
          saveEmotion(visibleTweetId, emotionResult.dominant_emotion);
        }
      }
    } catch (error) {
      console.error("Error analyzing emotion:", error);
    }
  };

  // Save emotion to the backend
  const saveEmotion = async (tweetId, emotion) => {
    try {
      await saveEmotionForTweet(tweetId, emotion);
    } catch (error) {
      console.error(`Error saving emotion for tweet ${tweetId}:`, error);
    }
  };

  // Function to handle intersection observer callbacks
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      loadMoreTweets();
    }
  }, [hasMore, loading, loadMoreTweets]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 0
    };
    
    const observer = new IntersectionObserver(handleObserver, option);
    
    if (tweetsContainerRef.current) {
      observer.observe(tweetsContainerRef.current);
    }
    
    return () => {
      if (tweetsContainerRef.current) {
        observer.unobserve(tweetsContainerRef.current);
      }
    };
  }, [handleObserver]);

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Accueil
      </Typography>
      
      {cameraError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCameraError(null)}>
          {cameraError}
        </Alert>
      )}
      
      <NewTweet onAddTweet={addNewTweet} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {tweets.map((tweet) => (
            <Tweet 
              key={tweet._id || uuidv4()} 
              tweet={tweet} 
              onInView={() => setVisibleTweetId(tweet._id)} 
            />
          ))}
          
          {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          )}
          
          {error && (
            <Typography color="error" align="center" my={4}>
              {error}
            </Typography>
          )}
          
          <div ref={tweetsContainerRef} style={{ height: "20px" }} />
        </Grid>
        
        {user && user.cameraOn && (
          <Grid item xs={12} md={4}>
            <Box sx={{ position: "sticky", top: 20 }}>
              <Typography variant="h6" gutterBottom>
                Analyse d'émotion en temps réel
              </Typography>
              
              <Box sx={{ position: "relative", marginBottom: 2 }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  style={{ width: "100%", borderRadius: 8 }} 
                />
                <canvas ref={canvasRef} style={{ display: "none" }} width="640" height="480" />
              </Box>
              
              {emotionData && (
                <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Émotion dominante:</strong> {emotionData.dominant_emotion}
                  </Typography>
                  
                  {Object.entries(emotionData.emotion_scores || {}).map(([emotion, score]) => (
                    <Box key={emotion} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2">{emotion}:</Typography>
                      <Typography variant="body2">{(score * 100).toFixed(2)}%</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Boîte de dialogue pour demander l'autorisation de la caméra */}
      <Dialog
        open={showCameraDialog}
        aria-labelledby="camera-dialog-title"
        aria-describedby="camera-dialog-description"
      >
        <DialogTitle id="camera-dialog-title">
          Autorisation de la caméra
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="camera-dialog-description">
            HackaTweet souhaite utiliser votre caméra pour l'analyse d'émotions en temps réel.
            Cette fonctionnalité permet d'analyser vos réactions aux tweets et d'enregistrer
            vos émotions pour améliorer votre expérience. Voulez-vous autoriser l'accès à votre caméra ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCameraPermission(false)} color="error">
            Refuser
          </Button>
          <Button onClick={() => handleCameraPermission(true)} color="primary" variant="contained">
            Autoriser
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Home;