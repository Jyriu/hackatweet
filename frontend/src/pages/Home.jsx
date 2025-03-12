import React, { useState } from "react";
import { Container, Typography, Box } from "@mui/material";
import { useTweets } from "../hooks/useTweets";
import NewTweet from "../components/NewTweet";

const Home = () => {
  console.log("Rendu du composant Home - Test avec NewTweet simplifié");
  
  // Utiliser le hook useTweets pour récupérer les tweets uniquement
  const { tweets, loading, error, createTweet } = useTweets();
  console.log("Tweets chargés:", tweets);
  
  // Function to add a new tweet
  const addNewTweet = async (newTweetData) => {
    try {
      await createTweet(newTweetData);
    } catch (error) {
      console.error("Error creating tweet:", error);
    }
  };
  
  return (
    <Container>
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Accueil - Version avec NewTweet simplifié
        </Typography>
        
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