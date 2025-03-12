import React from "react";
import { Container, Typography, Box } from "@mui/material";

const Home = () => {
  console.log("Rendu du composant Home");
  
  return (
    <Container>
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Accueil - Version simplifiée pour diagnostic
        </Typography>
        <Typography variant="body1">
          Si vous voyez ce message, le composant Home fonctionne correctement.
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;