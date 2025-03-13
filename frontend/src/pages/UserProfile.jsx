import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Box,
  Tabs,
  Tab,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import Tweet from "../components/Tweet";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const UserProfile = () => {
  const { username } = useParams();
  const [visitedUser, setVisitedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Tweets, 1: Likés, 2: Commentés
  const [tweets, setTweets] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [commentedTweets, setCommentedTweets] = useState([]);
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUserAndTweets = async () => {
      try {
        // Récupérer les informations de l'utilisateur visité
        const userResponse = await axios.get(
          `${API_URL}/api/user/by-username/${username}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVisitedUser(userResponse.data);
        // On utilise le champ isFollowing s'il est fourni par l'API
        setIsFollowing(userResponse.data.isFollowing || false);

        // Charger les tweets (tweets + retweets)
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
  }, [username, token]);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        // Désabonner via l'endpoint "unfollow"
        await axios.post(
          `${API_URL}/api/user/unfollow/${visitedUser._id}`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // S'abonner via l'endpoint "follow"
        await axios.post(
          `${API_URL}/api/user/follow/${visitedUser._id}`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Erreur lors du suivi/désuivi :", error);
    }
  };

  const handleTabChange = async (event, newValue) => {
    setSelectedTab(newValue);
    if (!visitedUser) return;
    try {
      if (newValue === 0) {
        // Charger les tweets
        const res = await axios.get(
          `${API_URL}/api/tweet/user/${visitedUser._id}/tweets`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTweets(res.data);
      } else if (newValue === 1) {
        // Charger les tweets likés
        const res = await axios.get(`${API_URL}/api/tweet/likedTweetsByUser`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLikedTweets(res.data);
      } else if (newValue === 2) {
        // Charger les tweets commentés
        const res = await axios.get(
          `${API_URL}/api/tweet/commentedTweetsByUser`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCommentedTweets(res.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des tweets :", error);
    }
  };

  const loadFollowers = () => {
    setLoadingFollowers(true);
    axios
      .get(`${API_URL}/api/user/${visitedUser.username}/followers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setFollowers(res.data);
        setLoadingFollowers(false);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des abonnés :", err);
        setLoadingFollowers(false);
      });
  };

  const loadFollowing = () => {
    setLoadingFollowing(true);
    axios
      .get(`${API_URL}/api/user/${visitedUser.username}/following`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setFollowing(res.data);
        setLoadingFollowing(false);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des abonnements :", err);
        setLoadingFollowing(false);
      });
  };

  const handleOpenFollowers = () => {
    setOpenFollowers(true);
    loadFollowers();
  };

  const handleCloseFollowers = () => {
    setOpenFollowers(false);
  };

  const handleOpenFollowing = () => {
    setOpenFollowing(true);
    loadFollowing();
  };

  const handleCloseFollowing = () => {
    setOpenFollowing(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!visitedUser) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">
          Utilisateur introuvable
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {/* En-tête du profil de l'utilisateur visité */}
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
        <Grid item xs>
          <Link to={`/user/${visitedUser.username}`} style={{ textDecoration: "none", color: "inherit" }}>
            <Typography variant="h5">{visitedUser.username}</Typography>
          </Link>
          <Typography variant="body1" color="textSecondary">
            {visitedUser.bio}
          </Typography>
          <Box mt={1} display="flex" gap={2}>
            <Button onClick={handleOpenFollowers} variant="text">
              Abonnés : {visitedUser.followers?.length || 0}
            </Button>
            <Button onClick={handleOpenFollowing} variant="text">
              Abonnements : {visitedUser.following?.length || 0}
            </Button>
          </Box>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color={isFollowing ? "secondary" : "primary"}
            onClick={handleFollowToggle}
          >
            {isFollowing ? "Se désabonner" : "Suivre"}
          </Button>
        </Grid>
      </Grid>

      {/* Onglets pour afficher Tweets, Likés, Commentés */}
      <Box sx={{ mt: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Tweets" />
          <Tab label="Likés" />
          <Tab label="Commentés" />
        </Tabs>
        <Box sx={{ mt: 2 }}>
          {selectedTab === 0 && (
            <>
              {tweets.length > 0 ? (
                tweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
              ) : (
                <Typography variant="body1" color="textSecondary">
                  Cet utilisateur n'a pas encore tweeté.
                </Typography>
              )}
            </>
          )}
          {selectedTab === 1 && (
            <>
              {likedTweets.length > 0 ? (
                likedTweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
              ) : (
                <Typography variant="body1" color="textSecondary">
                  Aucun tweet liké.
                </Typography>
              )}
            </>
          )}
          {selectedTab === 2 && (
            <>
              {commentedTweets.length > 0 ? (
                commentedTweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
              ) : (
                <Typography variant="body1" color="textSecondary">
                  Aucun tweet commenté.
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Dialog pour afficher la liste des abonnés */}
      <Dialog open={openFollowers} onClose={handleCloseFollowers} fullWidth maxWidth="sm">
        <DialogTitle>
          Abonnés
          <IconButton
            aria-label="close"
            onClick={handleCloseFollowers}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingFollowers ? (
            <CircularProgress />
          ) : visitedUser.followers && visitedUser.followers.length > 0 ? (
            <List>
              {followers.map((follower) => (
                <ListItem key={follower._id} button component={Link} to={`/user/${follower.username}`}>
                  <ListItemAvatar>
                    <Avatar
                      src={
                        follower.photo
                          ? `${API_URL}${follower.photo}`
                          : "https://via.placeholder.com/150?text=Avatar"
                      }
                      alt={follower.username}
                    />
                  </ListItemAvatar>
                  <ListItemText primary={`@${follower.username}`} secondary={follower.bio} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>Aucun abonné.</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour afficher la liste des abonnements */}
      <Dialog open={openFollowing} onClose={handleCloseFollowing} fullWidth maxWidth="sm">
        <DialogTitle>
          Abonnements
          <IconButton
            aria-label="close"
            onClick={handleCloseFollowing}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingFollowing ? (
            <CircularProgress />
          ) : visitedUser.following && visitedUser.following.length > 0 ? (
            <List>
              {following.map((followed) => (
                <ListItem key={followed._id} button component={Link} to={`/user/${followed.username}`}>
                  <ListItemAvatar>
                    <Avatar
                      src={
                        followed.photo
                          ? `${API_URL}${followed.photo}`
                          : "https://via.placeholder.com/150?text=Avatar"
                      }
                      alt={followed.username}
                    />
                  </ListItemAvatar>
                  <ListItemText primary={`@${followed.username}`} secondary={followed.bio} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>Aucun abonnement.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default UserProfile;
