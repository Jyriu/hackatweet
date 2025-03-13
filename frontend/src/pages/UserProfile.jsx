// UserProfile.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Typography, Avatar, Grid, Button, CircularProgress, Box } from "@mui/material";
import axios from "axios";
import Tweet from "../components/Tweet";

const UserProfile = () => {
  const { username } = useParams(); // Récupère le pseudo depuis l'URL
  const [visitedUser, setVisitedUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchUserAndTweets = async () => {
      try {
        // Récupérer les informations complètes de l'utilisateur visité
        const userResponse = await axios.get(
          `${API_URL}/api/users/by-username/${username}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVisitedUser(userResponse.data);
        setIsFollowing(userResponse.data.isFollowing);

        // Appel à la nouvelle route pour récupérer les tweets de l'utilisateur visité
        const tweetsResponse = await axios.get(
          `${API_URL}/api/tweet/user/${userResponse.data._id}/tweets`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTweets(tweetsResponse.data);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
      }
      setLoading(false);
    };

    fetchUserAndTweets();
  }, [username]);

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/users/follow/${visitedUser._id}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Erreur lors du suivi :", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {visitedUser ? (
        <>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Link to={`/user/${visitedUser.username}`} style={{ textDecoration: "none", color: "inherit" }}>
                <Avatar
                  src={
                    visitedUser.photo
                      ? `${API_URL}${visitedUser.photo}`
                      : "https://via.placeholder.com/150?text=Avatar"
                  }
                  alt={visitedUser.username}
                  sx={{ width: 80, height: 80 }}
                />
              </Link>
            </Grid>
            <Grid item>
              <Link to={`/user/${visitedUser.username}`} style={{ textDecoration: "none", color: "inherit" }}>
                <Typography variant="h5">{visitedUser.username}</Typography>
              </Link>
              <Typography variant="body1" color="textSecondary">
                {visitedUser.bio}
              </Typography>
            </Grid>
            <Grid item>
              <Button variant="contained" color={isFollowing ? "secondary" : "primary"} onClick={handleFollow}>
                {isFollowing ? "Se désabonner" : "Suivre"}
              </Button>
            </Grid>
          </Grid>

          {/* Liste des tweets de l'utilisateur visité */}
          <Box sx={{ mt: 3 }}>
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
