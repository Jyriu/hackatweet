import React, { useState } from "react";
import { Container, Typography, Box } from "@mui/material";
import { useTweets } from "../hooks/useTweets";

const Home = () => {
  console.log("Rendu du composant Home - Test avec useTweets");
  
  // Utiliser le hook useTweets pour récupérer les tweets uniquement
  const { tweets, loading, error } = useTweets();
  console.log("Tweets chargés:", tweets);
  console.log("État de loading:", loading);
  console.log("Erreur éventuelle:", error);
  
  return (
    <Container>
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Accueil - Version de diagnostic avec useTweets
        </Typography>
        <Typography variant="body1">
          Si vous voyez ce message, le composant Home fonctionne avec useTweets.
        </Typography>
        
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