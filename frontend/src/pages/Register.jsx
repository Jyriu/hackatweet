import React, { useState, useContext } from "react";
import axios from "axios";
import { Container, TextField, Button, Card, CardContent, Typography, Alert } from "@mui/material";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    username: "",
    bio: ""
  });

  const [error, setError] = useState(null);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const url = import.meta.env.VITE_BACKEND_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post(url + "/api/auth/register", formData);

      // Récupération du token et de l'utilisateur renvoyé par le backend
      const { token, user } = response.data;

      // Stockage du token dans le localStorage
      localStorage.setItem("token", token);

      // Mise à jour du contexte utilisateur
      setUser(user);

      // Redirection vers la page d'accueil
      navigate("/");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    }
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: 5 }}>
      <Card sx={{ padding: 3 }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" color="primary">
            Inscription
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nom"
              name="nom"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Prénom"
              name="prenom"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Nom d'utilisateur"
              name="username"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Adresse Email"
              name="email"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Mot de passe"
              name="password"
              type="password"
              margin="normal"
              variant="outlined"
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Bio"
              name="bio"
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
              onChange={handleChange}
            />
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              color="primary" 
              sx={{ marginTop: 2 }}
            >
              S'inscrire
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Register;
