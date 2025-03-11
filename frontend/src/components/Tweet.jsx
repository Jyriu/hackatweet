import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Grid, CircularProgress } from "@mui/material";
import Tweet from "./Tweet";

const TweetList = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const url = import.meta.env.VITE_BACKEND_URL; // Récupère l'URL du backend

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
      } catch (error) {
        console.error("Erreur lors de la récupération des tweets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTweets();
  }, [url]);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Grid container spacing={2}>
      {tweets.map((tweet) => (
        <Grid item xs={12} key={tweet._id || tweet.idTweet}>
          <Tweet tweet={tweet} />
        </Grid>
      ))}
    </Grid>
  );
};

export default TweetList;
