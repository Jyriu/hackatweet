import React, { useState } from "react";
import { Container, Typography, Box, Alert } from "@mui/material";
import { useTweets } from "../hooks/useTweets";
import NewTweet from "../components/NewTweet";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const Home = () => {
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
    <Container>
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Accueil - Version avec NewTweet simplifié
        </Typography>
        
        {tweetError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTweetError(null)}>
            {tweetError}
          </Alert>
        )}
        
        <NewTweet onAddTweet={addNewTweet} />
        
        <Typography variant="body1" mt={2}>
          Nombre de tweets chargés: {tweets ? tweets.length : 0}
        </Typography>
        
        {loading && (
          <Typography variant="body1" color="primary">
            Chargement des tweets en cours...
          </Typography>
        )}
        
        {error && (
          <Typography variant="body1" color="error">
            Erreur: {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default Home;