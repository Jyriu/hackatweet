import React, { useState, useEffect } from "react";
import {
  TextField,
  Box,
  CircularProgress,
  Grid,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import axios from "axios";
import {
  ChatBubbleOutline as TweetIcon,
  PersonOutline as UserIcon,
  Tag as HashtagIcon,
} from "@mui/icons-material";

const AdvancedSearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [searchType, setSearchType] = useState("tous"); // Par défaut, recherche de tout
  const [hasSearched, setHasSearched] = useState(false); // Nouvel état pour suivre si une recherche a été effectuée

  const url = import.meta.env.VITE_BACKEND_URL;

  // Fonction pour effectuer la recherche via l'API
  const performSearch = async (query, type) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${url}/api/search/advancedSearch`,
        {
          query,
          type: type === "tous" ? undefined : type, // "tous" envoie undefined
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Réponse API:", response.data); // Pour vérifier la réponse
      setSearchResults(response.data);
      setHasSearched(true); // Marquer qu'une recherche a été effectuée
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  // Gestion du onChange avec debounce de 1sec
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Supprime le timer précédent s'il existe
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Lance le timer de 1 seconde avant de faire la recherche
    const timer = setTimeout(() => {
      if (value.trim() !== "") {
        performSearch(value, searchType);
      } else {
        setSearchResults(null);
        setHasSearched(false); // Réinitialiser si la recherche est vide
      }
    }, 1000);

    setDebounceTimeout(timer);
  };

  // Gestion du changement de type de recherche
  const handleTypeChange = (e) => {
    setSearchType(e.target.value);
  };

  // useEffect pour relancer la recherche lorsque searchType change
  useEffect(() => {
    if (searchTerm.trim() !== "") {
      performSearch(searchTerm, searchType);
    }
  }, [searchType]); // Déclenché lorsque searchType change

  // Fonction pour vérifier si les résultats sont vides
  const isEmptyResults = () => {
    return (
      hasSearched &&
      (!searchResults ||
        (!searchResults.tweets?.length &&
          !searchResults.users?.length &&
          !searchResults.hashtags?.length))
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        p: 3,
        backgroundColor: "background.paper",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Recherche Avancée
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Rechercher..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select value={searchType} onChange={handleTypeChange} label="Type">
            <MenuItem value="tous">Tous</MenuItem>
            <MenuItem value="tweets">Tweets</MenuItem>
            <MenuItem value="users">Utilisateurs</MenuItem>
            <MenuItem value="hashtags">Hashtags</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Box sx={{ color: "error.main", textAlign: "center", mt: 2 }}>
          <Typography>{error}</Typography>
        </Box>
      )}

      {isEmptyResults() && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Aucun résultat trouvé.
          </Typography>
        </Box>
      )}

      {searchResults && (
        <Box sx={{ mt: 3 }}>
          {searchResults.tweets && searchResults.tweets.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <TweetIcon /> Tweets
              </Typography>
              <Grid container spacing={3}>
                {searchResults.tweets.map((tweet) => (
                  <Grid item xs={12} sm={6} md={4} key={tweet._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {tweet.text}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Par {tweet.author.username}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {searchResults.users && searchResults.users.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <UserIcon /> Utilisateurs
              </Typography>
              <Grid container spacing={3}>
                {searchResults.users.map((user) => (
                  <Grid item xs={12} sm={6} md={4} key={user._id}>
                    <Card>
                      <CardContent>
                        <List>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar src={user.photo} alt={user.username} />
                            </ListItemAvatar>
                            <ListItemText
                              primary={user.username}
                              secondary={`${user.nom} ${user.prenom}`}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {searchResults.hashtags && searchResults.hashtags.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <HashtagIcon /> Hashtags
              </Typography>
              <Grid container spacing={3}>
                {searchResults.hashtags.map((hashtag, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Typography variant="body1">#{hashtag}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AdvancedSearchBar;