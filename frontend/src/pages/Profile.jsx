import React, { useEffect, useState } from "react";
import {
  Container,
  Box,
  Tabs,
  Tab,
  Typography,
  Avatar,
  Button,
  TextField,
  CircularProgress,
  Divider,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
} from "@mui/material";
import axios from "axios";
import { useSelector } from "react-redux";
import Tweet from "../components/Tweet";
import CloseIcon from "@mui/icons-material/Close";

// Si Redux ne contient pas encore l'utilisateur, on tente de le récupérer depuis localStorage
const getCurrentUser = (reduxUser) => {
  if (reduxUser && reduxUser.username) return reduxUser;
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const Profile = () => {
  const reduxUser = useSelector((state) => state.user.currentUser);
  const user = getCurrentUser(reduxUser);
  const token = localStorage.getItem("token");

  // États pour le profil et pour les onglets
  const [profileData, setProfileData] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Tweets, 1: Signets, 2: Likés, 3: Commentés
  const [tweets, setTweets] = useState([]);
  const [bookmarkedTweets, setBookmarkedTweets] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [commentedTweets, setCommentedTweets] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // États pour la modification du profil
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [updateError, setUpdateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // États pour les pop-ups (Dialog) des abonnés et abonnements
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  // Charger les infos de profil via GET /api/user/by-username/:username
  useEffect(() => {
    if (!user) return;
    axios
      .get(`${API_URL}/api/user/by-username/${user.username}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProfileData(res.data);
        setBio(res.data.bio || "");
        setLoadingProfile(false);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement du profil :", err);
        setLoadingProfile(false);
      });
  }, [user, token]);

  // Chargement des contenus selon l'onglet sélectionné (0: Tweets, 1: Signets, 2: Likés, 3: Commentés)
  useEffect(() => {
    if (!user) return;
    setTabLoading(true);
    switch (selectedTab) {
      case 0:
        // Récupérer les tweets de l'utilisateur (tweets + retweets)
        axios
          .get(`${API_URL}/api/tweet/user/${user.id}/tweets`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setTweets(res.data);
            setTabLoading(false);
          })
          .catch((err) => {
            console.error("Erreur lors du chargement des tweets :", err);
            setTabLoading(false);
          });
        break;
      case 1:
        // Récupérer les tweets signet
        axios
          .get(`${API_URL}/api/tweet/bookmarkedTweets`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setBookmarkedTweets(res.data);
            setTabLoading(false);
          })
          .catch((err) => {
            console.error("Erreur lors du chargement des tweets signet :", err);
            setTabLoading(false);
          });
        break;
      case 2:
        // Récupérer les tweets likés
        axios
          .get(`${API_URL}/api/tweet/likedTweetsByUser`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setLikedTweets(res.data);
            setTabLoading(false);
          })
          .catch((err) => {
            console.error("Erreur lors du chargement des tweets likés :", err);
            setTabLoading(false);
          });
        break;
      case 3:
        // Récupérer les tweets commentés
        axios
          .get(`${API_URL}/api/tweet/commentedTweetsByUser`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setCommentedTweets(res.data);
            setTabLoading(false);
          })
          .catch((err) => {
            console.error("Erreur lors du chargement des tweets commentés :", err);
            setTabLoading(false);
          });
        break;
      default:
        setTabLoading(false);
    }
  }, [selectedTab, user, token]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Gestion de la modification du profil
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setUpdateError("");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateError("");
    setIsUpdating(true);
    const formData = new FormData();
    formData.append("bio", bio);
    if (photoFile) formData.append("photo", photoFile);
    if (bannerFile) formData.append("banner", bannerFile);
    try {
      const res = await axios.put(`${API_URL}/api/user/profile`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setProfileData(res.data.user);
      setIsEditing(false);
      setIsUpdating(false);
    } catch (err) {
      console.error(err);
      setUpdateError(err.response?.data?.message || "Erreur lors de la mise à jour");
      setIsUpdating(false);
    }
  };

  // Chargement des abonnés lorsque la pop-up s'ouvre
  const loadFollowers = () => {
    setLoadingFollowers(true);
    axios
      .get(`${API_URL}/api/user/${user.username}/followers`, {
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

  // Chargement des abonnements lorsque la pop-up s'ouvre
  const loadFollowing = () => {
    setLoadingFollowing(true);
    axios
      .get(`${API_URL}/api/user/${user.username}/following`, {
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

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6">Veuillez vous connecter pour voir votre profil.</Typography>
      </Container>
    );
  }

  if (loadingProfile || !profileData) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6">Chargement du profil...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {/* En-tête du profil */}
      <Card>
        <CardMedia
          component="img"
          height="200"
          image={
            profileData.banner
              ? `${API_URL}${profileData.banner}`
              : "https://via.placeholder.com/800x200?text=Bannière"
          }
          alt="Bannière de profil"
        />
        <CardContent>
          <Box display="flex" alignItems="center">
            <Avatar
              src={
                profileData.photo
                  ? `${API_URL}${profileData.photo}`
                  : "https://via.placeholder.com/150?text=Avatar"
              }
              alt={profileData.username}
              sx={{ width: 100, height: 100, border: "4px solid white", mt: -8, mr: 2 }}
            />
            <Box>
              <Typography variant="h4">@{profileData.username}</Typography>
              <Typography variant="body1">{profileData.bio}</Typography>
              <Box mt={1} display="flex" gap={2}>
                <Button onClick={handleOpenFollowers} variant="text">
                  Abonnés : {profileData.followers?.length || 0}
                </Button>
                <Button onClick={handleOpenFollowing} variant="text">
                  Abonnements : {profileData.following?.length || 0}
                </Button>
              </Box>
            </Box>
          </Box>
          <Box mt={2}>
            <Button variant="contained" onClick={handleEditToggle}>
              {isEditing ? "Annuler" : "Modifier le profil"}
            </Button>
          </Box>
          {isEditing && (
            <Box component="form" onSubmit={handleUpdateProfile} mt={2}>
              {updateError && <Typography color="error">{updateError}</Typography>}
              <TextField
                label="Bio"
                fullWidth
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                margin="normal"
              />
              <Button variant="outlined" component="label" sx={{ mr: 2, mt: 1 }}>
                Choisir une photo de profil
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                />
              </Button>
              <Button variant="outlined" component="label" sx={{ mr: 2, mt: 1 }}>
                Choisir une bannière
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files[0])}
                />
              </Button>
              <Box mt={2}>
                <Button type="submit" variant="contained" color="primary">
                  {isUpdating ? <CircularProgress size={24} color="inherit" /> : "Enregistrer"}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Onglets pour afficher Tweets, Signets, Likés, Commentés */}
      <Tabs value={selectedTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
        <Tab label="Tweets" />
        <Tab label="Signets" />
        <Tab label="Likés" />
        <Tab label="Commentés" />
      </Tabs>

      <Box mt={2}>
        {tabLoading ? (
          <CircularProgress />
        ) : (
          <>
            {selectedTab === 0 && (
              <Box>
                {tweets.length > 0 ? (
                  tweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
                ) : (
                  <Typography>Aucun tweet pour le moment.</Typography>
                )}
              </Box>
            )}
            {selectedTab === 1 && (
              <Box>
                {bookmarkedTweets.length > 0 ? (
                  bookmarkedTweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
                ) : (
                  <Typography>Aucun tweet signet.</Typography>
                )}
              </Box>
            )}
            {selectedTab === 2 && (
              <Box>
                {likedTweets.length > 0 ? (
                  likedTweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
                ) : (
                  <Typography>Aucun tweet liké.</Typography>
                )}
              </Box>
            )}
            {selectedTab === 3 && (
              <Box>
                {commentedTweets.length > 0 ? (
                  commentedTweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
                ) : (
                  <Typography>Aucun tweet commenté.</Typography>
                )}
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Dialog pour afficher les abonnés */}
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
          ) : followers.length > 0 ? (
            <List>
              {followers.map((follower) => (
                <ListItem key={follower._id}>
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

      {/* Dialog pour afficher les abonnements */}
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
          ) : following.length > 0 ? (
            <List>
              {following.map((followed) => (
                <ListItem key={followed._id}>
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

export default Profile;
