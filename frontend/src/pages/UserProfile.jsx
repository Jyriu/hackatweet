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
import { useSelector } from "react-redux";
import TweetList from "../components/TweetList";
import useEmotionDetection from "../hooks/useEmotionDetection";

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
  const token = useSelector((state) => state.user.token);
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
          headers: { Authorization: `Bearer ${token}` },
        });
        setLikedTweets(res.data);
      } else if (newValue === 2) {
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
    <Container maxWidth="md" sx={{ mt: 4 }}>
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
              Abonnés : {visitedUser.followers ? visitedUser.followers.length : 0}
            </Button>
            <Button onClick={handleOpenFollowing} variant="text">
              Abonnements : {visitedUser.following ? visitedUser.following.length : 0}
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

      <Box sx={{ mt: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Tweets" />
          <Tab label="Likés" />
          <Tab label="Commentés" />
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
          {selectedTab === 2 && (
            <TweetList
              tweets={commentedTweets}
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

      {/* Hidden Video and Canvas Elements */}
      <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Container>
  );
};

export default UserProfile;