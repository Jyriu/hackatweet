import React, { useState, useEffect } from "react";
import { Container, Typography, Grid, CircularProgress } from "@mui/material";
import Tweet from "../components/Tweet";
import NewTweet from "../components/NewTweet";

const Home = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les tweets depuis localStorage au démarrage
  useEffect(() => {
    const storedTweets = localStorage.getItem("tweets");
    if (storedTweets) {
      setTweets(JSON.parse(storedTweets));
    }
    setLoading(false);
  }, []);

  // Ajouter un tweet et le sauvegarder dans localStorage
  const addNewTweet = (newTweet) => {
    const updatedTweets = [newTweet, ...tweets];
    setTweets(updatedTweets);
    localStorage.setItem("tweets", JSON.stringify(updatedTweets));
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
            <Grid item xs={12} key={tweet.idTweet}>
              <Tweet tweet={tweet} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Home;
