// import React, { useContext, useEffect, useState } from "react";
// import axios from "axios";
// import {
//   Container,
//   Card,
//   CardMedia,
//   Avatar,
//   Typography,
//   CardContent,
//   Divider,
//   Box,
// } from "@mui/material";
// import { UserContext } from "../context/UserContext";

// const Profile = () => {
//   const { user } = useContext(UserContext);
//   const [profileData, setProfileData] = useState(null);
//   const [tweets, setTweets] = useState([]);

//   useEffect(() => {
//     if (!user) return;

//     // Récupération du profil complet (l'endpoint doit renvoyer directement l'objet utilisateur)
//     axios
//       .get(`http://localhost:5001/api/users/profile/${user.username}`)
//       .then((res) => {
//         console.log("Profil récupéré :", res.data);
//         setProfileData(res.data);
//       })
//       .catch((err) =>
//         console.error("Erreur lors de la récupération du profil :", err)
//       );

//     // Exemple de récupération des tweets, à adapter si vous disposez d'un endpoint spécifique
//     axios
//       .get(`http://localhost:5001/api/users/${user.username}/tweets`)
//       .then((res) => {
//         console.log("Tweets récupérés :", res.data);
//         setTweets(res.data || []);
//       })
//       .catch((err) =>
//         console.error("Erreur lors de la récupération des tweets :", err)
//       );
//   }, [user]);

//   // Si l'utilisateur n'est pas connecté
//   if (!user) {
//     return (
//       <Container sx={{ mt: 4 }}>
//         <Typography variant="h6">
//           Veuillez vous connecter pour voir votre profil.
//         </Typography>
//       </Container>
//     );
//   }

//   // Si le profil n'est pas encore chargé
//   if (!profileData) {
//     return (
//       <Container sx={{ mt: 4 }}>
//         <Typography variant="h6">Chargement du profil...</Typography>
//       </Container>
//     );
//   }

//   return (
//     <Container maxWidth="sm" sx={{ mt: 4 }}>
//       <Card>
//         {/* Bannière */}
//         <CardMedia
//           component="img"
//           height="150"
//           image={profileData.banner || "https://via.placeholder.com/800x200"}
//           alt="Bannière"
//         />
//         <CardContent
//           sx={{
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//           }}
//         >
//           {/* Avatar */}
//           <Avatar
//             src={profileData.photo || "https://via.placeholder.com/150"}
//             sx={{
//               width: 100,
//               height: 100,
//               mt: -6,
//               mb: 2,
//               border: "3px solid white",
//             }}
//           />
//           <Typography variant="h5">@{profileData.username}</Typography>
//           <Typography variant="body2" color="text.secondary">
//             {profileData.bio}
//           </Typography>
//           <Typography variant="subtitle1" sx={{ mt: 2 }}>
//             Abonnés : {profileData.followers?.length || 0} | Abonnements :{" "}
//             {profileData.following?.length || 0}
//           </Typography>

//           <Divider sx={{ my: 2 }} />

//           <Typography variant="h6" sx={{ mb: 1 }}>
//             Historique des Tweets
//           </Typography>
//           {tweets.length > 0 ? (
//             tweets.map((tweet) => (
//               <Card key={tweet._id} sx={{ my: 1, width: "100%" }}>
//                 <CardContent>
//                   <Typography>{tweet.content}</Typography>
//                   <Typography variant="caption">
//                     Likes : {tweet.likes?.length || 0}
//                   </Typography>
//                 </CardContent>
//               </Card>
//             ))
//           ) : (
//             <Typography variant="body2">Aucun tweet pour le moment.</Typography>
//           )}
//         </CardContent>
//       </Card>
//     </Container>
//   );
// };

// export default Profile;

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
} from "@mui/material";
import { UserContext } from "../context/UserContext";

const Profile = () => {
  const { user, setUser } = useContext(UserContext);
  const [profileData, setProfileData] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    // Récupération du profil via GET /api/users/profile/:username
    axios
      .get(`http://localhost:5001/api/users/profile/${user.username}`)
      .then((res) => {
        console.log("Profil récupéré :", res.data);
        // Ici, l'endpoint renvoie directement l'objet utilisateur
        setProfileData(res.data);
        setBio(res.data.bio || "");
      })
      .catch((err) =>
        console.error("Erreur lors de la récupération du profil :", err)
      );

    // Récupération des tweets de l'utilisateur via GET /api/users/{username}/tweets
    axios
      .get(`http://localhost:5001/api/users/${user.username}/tweets`)
      .then((res) => {
        console.log("Tweets récupérés :", res.data);
        setTweets(res.data || []);
      })
      .catch((err) =>
        console.error("Erreur lors de la récupération des tweets :", err)
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

  // Mode édition pour mettre à jour la bio et télécharger photo/bannière
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError("");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    const formData = new FormData();
    formData.append("bio", bio);
    if (photoFile) formData.append("photo", photoFile);
    if (bannerFile) formData.append("banner", bannerFile);
    try {
      const res = await axios.put(
        "http://localhost:5001/api/users/profile",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setProfileData(res.data.user);
      setUser(res.data.user);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Erreur lors de la mise à jour");
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
            profileData.banner ||
            "https://via.placeholder.com/800x200?text=Bannière"
          }
          alt="Bannière de profil"
        />
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Avatar */}
            <Avatar
              src={
                profileData.photo ||
                "https://via.placeholder.com/150?text=Avatar"
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
                  Enregistrer
                </Button>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ mb: 1 }}>
            Historique des Tweets
          </Typography>
          {tweets.length > 0 ? (
            tweets.map((tweet) => (
              <Card key={tweet._id} sx={{ my: 1, width: "100%" }}>
                <CardContent>
                  <Typography>{tweet.content}</Typography>
                  <Typography variant="caption">
                    Likes : {tweet.likes?.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography variant="body2">Aucun tweet pour le moment.</Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;
