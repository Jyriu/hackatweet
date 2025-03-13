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
import { useSelector } from "react-redux";
import TweetList from "../components/TweetList";
import useEmotionDetection from "../hooks/useEmotionDetection";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const UserProfile = () => {
  const { username } = useParams();
  const [visitedUser, setVisitedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Tweets, 1: Likés
  const [tweets, setTweets] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const token = localStorage.getItem('token')
  const currentUser = useSelector((state) => state.user.currentUser);
  const currentUserId = currentUser ? currentUser.id : null;

  // Emotion detection
  const { emotionData, videoRef, canvasRef } = useEmotionDetection();

  const fetchVisitedUser = async () => {
    try {
      const userResponse = await axios.get(
        `${API_URL}/api/user/by-username/${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVisitedUser(userResponse.data);
      console.log(userResponse.data)
      if (userResponse.data.followers) {
        setIsFollowing(
          userResponse.data.followers.some(
            (follower) => String(follower._id) === String(currentUserId)
          )
        );
      } else {
        setIsFollowing(false);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchVisitedUser();
      setLoading(false);
    };
    fetchData();
  }, [username, token, currentUserId]);

  useEffect(() => {
    if (visitedUser) {
      axios
        .get(`${API_URL}/api/tweet/user/${visitedUser._id}/tweets`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setTweets(res.data);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement des tweets :", error);
        });
    }
  }, [visitedUser, token]);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await axios.post(
          `${API_URL}/api/user/unfollow/${visitedUser._id}`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/api/user/follow/${visitedUser._id}`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await fetchVisitedUser();
    } catch (error) {
      console.error("Erreur lors du suivi/désuivi :", error);
    }
  };

  const handleTabChange = async (event, newValue) => {
    setSelectedTab(newValue);
    if (!visitedUser) return;
    try {
      if (newValue === 0) {
        const res = await axios.get(
          `${API_URL}/api/tweet/user/${visitedUser._id}/tweets`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTweets(res.data);
      } else if (newValue === 1) {
        const res = await axios.get(`${API_URL}/api/tweet/likedTweetsByUser`, {
          headers: { Authorization: `Bearer ${token}` } }
        );
        setLikedTweets(res.data);
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

  const handleRetweet = (newRetweet) => {
    setTweets((prevTweets) => [newRetweet, ...prevTweets]);
  };

  const handleUpdateTweet = (updatedTweet) => {
    setTweets((prevTweets) =>
      prevTweets.map((tweet) =>
        tweet._id === updatedTweet._id ? updatedTweet : tweet
      )
    );
  };

  const saveEmotion = async (tweetId, emotion) => {
    try {
      await axios.post(
        `${API_URL}/api/tweet/saveEmotion`,
        { userId: currentUserId, tweetId, emotion },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error saving emotion:", error);
    }
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
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
        }}
      >
        {/* Colonne de gauche : Informations de l'utilisateur */}
        <Box sx={{ width: { xs: "100%", md: 400 } }}>
          <Box
            sx={{
              borderRadius: 16,
              boxShadow: "0px 12px 32px rgba(0,0,0,0.15)",
              overflow: "hidden",
              backgroundColor: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Box
              component="img"
              src={
                visitedUser.banner
                  ? `${API_URL}${visitedUser.banner}`
                  : "http://localhost:5001/uploads/1741892926871-286576935.jpg"
              }
              alt="Bannière de profil"
              sx={{ width: "100%", height: 300, objectFit: "cover" }}
            />
            <Box sx={{ p: 3, position: "relative" }}>
              <Avatar
                src={
                  visitedUser.photo
                    ? `${API_URL}${visitedUser.photo}`
                    : "https://via.placeholder.com/150?text=Avatar"
                }
                alt={visitedUser.username}
                sx={{
                  width: 120,
                  height: 120,
                  border: "4px solid white",
                  position: "absolute",
                  top: -60,
                  left: 20,
                }}
              />
              <Box ml={15} sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 700,
                    color: "#000",
                  }}
                >
                  @{visitedUser.username}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {visitedUser.bio}
                </Typography>
                <Box
                  mt={1}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Button
                    onClick={handleOpenFollowers}
                    variant="text"
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Abonnés : {visitedUser.followers ? visitedUser.followers.length : 0}
                  </Button>
                  <Button
                    onClick={handleOpenFollowing}
                    variant="text"
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Abonnements : {visitedUser.following ? visitedUser.following.length : 0}
                  </Button>
                </Box>
                <Box mt={3} textAlign="center">
                  <Button
                    variant="contained"
                    color={isFollowing ? "secondary" : "primary"}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? "Se désabonner" : "Suivre"}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Colonne de droite : Onglets et contenus */}
        <Box sx={{ flex: 1 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 3,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
              "& .MuiTabs-indicator": { backgroundColor: "#75B7B0" },
            }}
          >
            <Tab label="Tweets" />
            <Tab label="Likés" />
          </Tabs>
          <Box sx={{ mt: 2 }}>
            {selectedTab === 0 && (
              <TweetList
                tweets={tweets}
                loading={loading}
                hasMore={false}
                user={currentUser}
                onSaveEmotion={saveEmotion}
                visibleTweetId={null}
                emotionData={emotionData}
                onRetweet={handleRetweet}
                onUpdateTweet={handleUpdateTweet}
              />
            )}
            {selectedTab === 1 && (
              <TweetList
                tweets={likedTweets}
                loading={loading}
                hasMore={false}
                user={currentUser}
                onSaveEmotion={saveEmotion}
                visibleTweetId={null}
                emotionData={emotionData}
                onRetweet={handleRetweet}
                onUpdateTweet={handleUpdateTweet}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Dialog pour afficher les abonnés */}
      <Dialog
        open={openFollowers}
        onClose={handleCloseFollowers}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            boxShadow: "0px 12px 32px rgba(0,0,0,0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
          }}
        >
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
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress />
            </Box>
          ) : visitedUser.followers && visitedUser.followers.length > 0 ? (
            <List>
              {followers.map((follower) => (
                <ListItem
                  key={follower._id}
                  button
                  component={Link}
                  to={`/user/${follower.username}`}
                >
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
                  <ListItemText
                    primary={`@${follower.username}`}
                    secondary={follower.bio}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>Aucun abonné.</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour afficher les abonnements */}
      <Dialog
        open={openFollowing}
        onClose={handleCloseFollowing}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            boxShadow: "0px 12px 32px rgba(0,0,0,0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
          }}
        >
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
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress />
            </Box>
          ) : visitedUser.following && visitedUser.following.length > 0 ? (
            <List>
              {following.map((followed) => (
                <ListItem
                  key={followed._id}
                  button
                  component={Link}
                  to={`/user/${followed.username}`}
                >
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
                  <ListItemText
                    primary={`@${followed.username}`}
                    secondary={followed.bio}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>Aucun abonnement.</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden Video and Canvas Elements */}
      <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Container>
  );
};

export default UserProfile;
