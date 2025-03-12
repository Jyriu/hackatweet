import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Card,
  CardMedia,
  Avatar,
  Typography,
  CardContent,
  Divider,
  Box,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";
import { UserContext } from "../context/UserContext";

const Profile = () => {
  const { user, setUser } = useContext(UserContext);
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
  // Récupération du profil via GET /api/users/profile/:username
  useEffect(() => {
    if (!user) return;
    axios
      .get(`${API_URL}/api/users/profile/${user.username}`)
      .then((res) => {
        console.log("Profil récupéré :", res.data);
        setProfileData(res.data);
        setBio(res.data.bio || "");
      })
      .catch((err) =>
        console.error("Erreur lors de la récupération du profil :", err)
      );
  }, [user]);

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6">
          Veuillez vous connecter pour voir votre profil.
        </Typography>
      </Container>
    );
  }
  if (!profileData) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6">Chargement du profil...</Typography>
      </Container>
    );
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError("");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setIsUpdating(true);
    const formData = new FormData();
    formData.append("bio", bio);
    if (photoFile) formData.append("photo", photoFile);
    if (bannerFile) formData.append("banner", bannerFile);
    try {
      const token = localStorage.getItem("token");
      console.log("Envoi de la mise à jour avec token:", token);
      const res = await axios.put(
        `${API_URL}api/users/profile`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Réponse de la mise à jour :", res.data);
      setProfileData(res.data.user);
      setUser(res.data.user);
      setIsEditing(false);
      setIsUpdating(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Erreur lors de la mise à jour");
      setIsUpdating(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Card>
        {/* Bannière de profil */}
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
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Avatar de profil */}
            <Avatar
              src={
                profileData.photo
                  ? `${API_URL}${profileData.photo}`
                  : "https://via.placeholder.com/150?text=Avatar"
              }
              sx={{
                width: 100,
                height: 100,
                border: "4px solid white",
                mt: -8,
                mr: 2,
              }}
            />
            <Box>
              <Typography variant="h4">@{profileData.username}</Typography>
              <Typography variant="body1" color="text.secondary">
                {profileData.bio}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2">
              Abonnés : {profileData.followers?.length || 0} | Abonnements :{" "}
              {profileData.following?.length || 0}
            </Typography>
          </Box>
          <Button variant="contained" onClick={handleEditToggle}>
            {isEditing ? "Annuler" : "Modifier le profil"}
          </Button>

          {isEditing && (
            <Box component="form" onSubmit={handleUpdateProfile} sx={{ mt: 2 }}>
              {error && <Typography color="error">{error}</Typography>}
              <TextField
                label="Bio"
                fullWidth
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                margin="normal"
              />
              <Button
                variant="outlined"
                component="label"
                sx={{ mr: 2, mt: 1 }}
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
                sx={{ mr: 2, mt: 1 }}
              >
                Choisir une bannière
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files[0])}
                />
              </Button>
              <Box sx={{ mt: 2 }}>
                <Button type="submit" variant="contained" color="primary">
                  {isUpdating ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ mb: 1 }}>
            Historique des Tweets
          </Typography>
          <Typography variant="body2">
            La fonctionnalité d'historique des tweets est temporairement
            désactivée.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;
