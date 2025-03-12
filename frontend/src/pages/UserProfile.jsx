import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Typography, Avatar, Grid, Button, CircularProgress, Box } from "@mui/material";
import axios from "axios";
import Tweet from "../components/Tweet";

const UserProfile = () => {
  const { username } = useParams(); // Récupère le pseudo depuis l'URL
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    
    // Récupérer les informations de l'utilisateur
    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/users/${username}`);
        setUser(response.data);
        setIsFollowing(response.data.isFollowing); // Si on a un système de followers
      } catch (error) {
        console.error("Erreur lors de la récupération du profil utilisateur :", error);
      }
    };

    // Récupérer les tweets de cet utilisateur
    const fetchTweets = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/tweet/user/${username}`);
        setTweets(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des tweets :", error);
      }
    };

    fetchUser();
    fetchTweets();
    setLoading(false);
  }, [username]);

  // Fonction pour suivre/désuivre l'utilisateur
  const handleFollow = async () => {
    try {
      await axios.post(`http://localhost:5001/api/users/follow/${username}`);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Erreur lors du suivi :", error);
    }
  };

  console.log("Pseudo récupéré :", username);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Container maxWidth="md" sx={{ marginTop: 4 }}>
      {user ? (
        <>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar src={user.profilePicture} alt={user.username} sx={{ width: 80, height: 80 }} />
            </Grid>
            <Grid item>
              <Typography variant="h5">{user.username}</Typography>
              <Typography variant="body1" color="textSecondary">{user.bio}</Typography>
            </Grid>
            <Grid item>
              <Button 
                variant="contained" 
                color={isFollowing ? "secondary" : "primary"} 
                onClick={handleFollow}
              >
                {isFollowing ? "Se désabonner" : "Suivre"}
              </Button>
            </Grid>
          </Grid>

          {/* Liste des tweets */}
          <Box sx={{ marginTop: 3 }}>
            {tweets.length > 0 ? (
              tweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
            ) : (
              <Typography variant="body1" color="textSecondary">
                Cet utilisateur n'a pas encore tweeté.
              </Typography>
            )}
          </Box>
        </>
      ) : (
        <Typography variant="h6" color="error">Utilisateur introuvable</Typography>
      )}
    </Container>
  );
};

export default UserProfile;
