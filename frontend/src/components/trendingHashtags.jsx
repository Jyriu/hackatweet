import React, { useState, useEffect } from "react";
import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";
import { fetchTrendingHashtags } from "../services/api"; // Importer la fonction pour récupérer les hashtags tendances

const TrendingHashtags = () => {
  const [hashtags, setHashtags] = useState([]); // État pour stocker les hashtags
  const [loading, setLoading] = useState(true); // État pour gérer le chargement
  const [error, setError] = useState(null); // État pour gérer les erreurs

  // Charger les hashtags tendances au montage du composant
  useEffect(() => {
    const fetchHashtags = async () => {
      try {
        const data = await fetchTrendingHashtags(); // Appeler l'API
        setHashtags(data); // Mettre à jour l'état avec les hashtags récupérés
      } catch (error) {
        console.error("Erreur lors de la récupération des hashtags tendances :", error);
        setError("Erreur lors du chargement des tendances.");
      } finally {
        setLoading(false); // Désactiver le chargement
      }
    };

    fetchHashtags();
  }, []);

  // Afficher un message de chargement
  if (loading) {
    return <Typography>Chargement des tendances...</Typography>;
  }

  // Afficher un message d'erreur
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  // Afficher la liste des hashtags
  return (
    <Box sx={{ width: "100%", maxWidth: 300, bgcolor: "background.paper", p: 2 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Tendances
      </Typography>
      <List>
        {hashtags.map((hashtag, index) => (
          <ListItem key={index} sx={{ py: 1 }}>
            <ListItemText primary={`#${hashtag._id}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default TrendingHashtags;