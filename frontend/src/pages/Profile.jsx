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
  Slide,
} from "@mui/material";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "../redux/Store"; // Ajustez le chemin si nécessaire
import TweetList from "../components/TweetList";
import CloseIcon from "@mui/icons-material/Close";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const Profile = () => {
  const dispatch = useDispatch();
  // Utiliser Redux pour currentUser et token
  const currentUser = useSelector((state) => state.user.currentUser);
  const token = localStorage.getItem("token");

  // On suppose que currentUser n'est jamais null quand l'utilisateur est connecté
  const [profileData, setProfileData] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Tweets, 1: Signets, 2: Likés, 3: Commentés
  const [tweets, setTweets] = useState([]);
  const [bookmarkedTweets, setBookmarkedTweets] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // États pour la modification du profil
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [updateError, setUpdateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // États pour les Dialogs des abonnés et abonnements
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  // Charger les infos de profil via GET /api/user/by-username/:username
  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/user/by-username/${currentUser.username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // On attend un objet complet avec followers et following (via populate dans l'API)
      setProfileData(res.data);
      setBio(res.data.bio || "");
      setLoadingProfile(false);
    } catch (err) {
      console.error("Erreur lors du chargement du profil :", err);
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser, token]);

  // Charger les contenus selon l'onglet sélectionné
  useEffect(() => {
    if (!currentUser) return;
    setTabLoading(true);
    switch (selectedTab) {
      case 0:
        axios
          .get(`${API_URL}/api/tweet/user/${currentUser._id}/tweets`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            // Si des tweets sont trouvés, on les utilise
            if (res.data && res.data.length > 0) {
              setTweets(res.data);
              setTabLoading(false);
            } else {
              // Aucun tweet trouvé, on réessaie avec currentUser.id
              axios
                .get(`${API_URL}/api/tweet/user/${currentUser.id}/tweets`, {
                  headers: { Authorization: `Bearer ${token}` },
                })
                .then((resRetry) => {
                  setTweets(resRetry.data);
                  setTabLoading(false);
                })
                .catch((errRetry) => {
                  console.error(
                    "Erreur lors du chargement des tweets avec currentUser.id :",
                    errRetry
                  );
                  setTabLoading(false);
                });
            }
          })
          .catch((err) => {
            console.error(
              "Erreur lors du chargement des tweets avec currentUser._id :",
              err
            );
            // En cas d'erreur sur la première requête, on tente aussi avec currentUser.id
            axios
              .get(`${API_URL}/api/tweet/user/${currentUser.id}/tweets`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((resRetry) => {
                setTweets(resRetry.data);
                setTabLoading(false);
              })
              .catch((errRetry) => {
                console.error(
                  "Erreur lors du chargement des tweets avec currentUser.id :",
                  errRetry
                );
                setTabLoading(false);
              });
          });
        break;
      case 1:
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
        axios
          .get(`${API_URL}/api/tweet/commentedTweetsByUser`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setLikedTweets(res.data); // Ou setCommentedTweets(res.data) si votre API renvoie un autre champ
            setTabLoading(false);
          })
          .catch((err) => {
            console.error(
              "Erreur lors du chargement des tweets commentés :",
              err
            );
            setTabLoading(false);
          });
        break;
      default:
        setTabLoading(false);
    }
  }, [selectedTab, currentUser, token]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Gestion de la modification du profil
  const handleEditToggle = () => {
    // Au passage en mode édition, on s'assure que le champ bio est mis à jour
    if (!isEditing && profileData) {
      setBio(profileData.bio || "");
    }
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
      // Mettez à jour à la fois le state local et Redux
      setProfileData(res.data.user);
      dispatch(setUser(res.data.user));
      setIsEditing(false);
      setIsUpdating(false);
      // Pour être sûr que les compteurs d'abonnés/abonnements sont à jour, on recharge le profil
      fetchProfile();
    } catch (err) {
      console.error(err);
      setUpdateError(
        err.response?.data?.message || "Erreur lors de la mise à jour"
      );
      setIsUpdating(false);
    }
  };

  // Chargement des abonnés lorsque la pop-up s'ouvre
  const loadFollowers = () => {
    setLoadingFollowers(true);
    axios
      .get(`${API_URL}/api/user/${currentUser.username}/followers`, {
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
      .get(`${API_URL}/api/user/${currentUser.username}/following`, {
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

  if (!currentUser) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6">
          Veuillez vous connecter pour voir votre profil.
        </Typography>
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
          <Slide
            direction="up"
            in={true}
            mountOnEnter
            unmountOnExit
            timeout={500}
          >
            <Card
              sx={{
                borderRadius: 12,
                boxShadow: "0px 12px 32px rgba(0,0,0,0.15)",
                overflow: "hidden",
                backgroundColor: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(10px)",
              }}
            >
              <CardMedia
                component="img"
                height="300"
                image={
                  profileData.banner
                    ? `${API_URL}${profileData.banner}`
                    : "https://via.placeholder.com/800x300?text=Bannière"
                }
                alt="Bannière de profil"
              />
              <CardContent sx={{ pt: 4, position: "relative" }}>
                <Box display="flex" alignItems="center">
                  <Avatar
                    src={
                      profileData.photo
                        ? `${API_URL}${profileData.photo}`
                        : "https://via.placeholder.com/150?text=Avatar"
                    }
                    alt={profileData.username}
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
                      @{profileData.username}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {profileData.bio}
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
                        Abonnés : {profileData.followers?.length || 0}
                      </Button>
                      <Button
                        onClick={handleOpenFollowing}
                        variant="text"
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Abonnements : {profileData.following?.length || 0}
                      </Button>
                    </Box>
                  </Box>
                </Box>
                <Box mt={8} textAlign="center">
                  <Button
                    variant="contained"
                    onClick={handleEditToggle}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    {isEditing ? "Annuler" : "Modifier le profil"}
                  </Button>
                </Box>
                {isEditing && (
                  <Box component="form" onSubmit={handleUpdateProfile} mt={3}>
                    {updateError && (
                      <Typography color="error" sx={{ mb: 2 }}>
                        {updateError}
                      </Typography>
                    )}
                    <TextField
                      label="Bio"
                      fullWidth
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      margin="normal"
                    />
                    <Box display="flex" gap={2} mt={1}>
                      <Button
                        variant="outlined"
                        component="label"
                        sx={{ textTransform: "none" }}
                      >
                        Choisir une photo de profil
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => setPhotoFile(e.target.files[0])}
                        />
                      </Button>
                      <Button
                        variant="outlined"
                        component="label"
                        sx={{ textTransform: "none" }}
                      >
                        Choisir une bannière
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => setBannerFile(e.target.files[0])}
                        />
                      </Button>
                    </Box>
                    <Box mt={2} textAlign="center">
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        {isUpdating ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Enregistrer"
                        )}
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Slide>
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
            <Tab label="Signets" />
            <Tab label="Likés" />
          </Tabs>
          <Box sx={{ mt: 2 }}>
            {tabLoading ? (
              <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {selectedTab === 0 && (
                  <TweetList
                    tweets={tweets}
                    loading={tabLoading}
                    hasMore={false}
                    user={currentUser}
                  />
                )}
                {selectedTab === 1 && (
                  <TweetList
                    tweets={bookmarkedTweets}
                    loading={tabLoading}
                    hasMore={false}
                    user={currentUser}
                  />
                )}
                {selectedTab === 2 && (
                  <TweetList
                    tweets={likedTweets}
                    loading={tabLoading}
                    hasMore={false}
                    user={currentUser}
                  />
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Dialog pour afficher la liste des abonnés */}
      <Dialog
        open={openFollowers}
        onClose={handleCloseFollowers}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 8,
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
          ) : followers.length > 0 ? (
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

      {/* Dialog pour afficher la liste des abonnements */}
      <Dialog
        open={openFollowing}
        onClose={handleCloseFollowing}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 8,
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
          ) : following.length > 0 ? (
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
    </Container>
  );
};

export default Profile;
