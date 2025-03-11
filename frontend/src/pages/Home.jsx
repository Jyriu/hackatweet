import React, { useState, useEffect } from "react";
import { Container, Typography, Grid, CircularProgress } from "@mui/material";
import Tweet from "../components/Tweet";
import NewTweet from "../components/NewTweet";
import axios from "axios";

const Home = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const url = import.meta.env.VITE_BACKEND_URL;

  // Charger les tweets depuis le backend
  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const response = await axios.get(url + "/api/tweet");
        setTweets(response.data); // Met à jour l'état avec les tweets récupérés
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des tweets:', error);
        setLoading(false);
      }
    };
    fetchTweets();
  }, []);

  // Ajouter un tweet et le sauvegarder dans la base de données
  const addNewTweet = async (newTweet) => {
    try {
      const response = await axios.post(url + "/api/tweet/createTweet", newTweet);
      setTweets([response.data, ...tweets]); // Ajoute le tweet au début de la liste des tweets
    } catch (error) {
      console.error("Erreur lors de l'ajout du tweet:", error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: 4 }}>
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
        <Grid container spacing={2}>
          {tweets.map((tweet) => (
            <Grid item xs={12} key={tweet._id}>
              <Tweet tweet={tweet} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Home;
