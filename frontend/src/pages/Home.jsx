import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Typography, Grid, CircularProgress } from "@mui/material";
import Tweet from "../components/Tweet";
import NewTweet from "../components/Newtweet";

const Home = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Récupération de l'URL du backend depuis l'environnement VITE_BACKEND_URL
  const url = import.meta.env.VITE_BACKEND_URL;

  // Charger les tweets depuis le backend au démarrage
  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(url + "/api/tweet/tweets", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTweets(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des tweets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTweets();
  }, [url]);

  // Ajouter un nouveau tweet à la liste (mise à jour côté frontend)
  const addNewTweet = (newTweet) => {
    setTweets([newTweet, ...tweets]);
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
